//initialize variables
var text = "";
var lineNumber = 1;

while (lineNumber < 4) {
    var syllables = 5;
    if (lineNumber == 2) {
	syllables = 7;
    }
	
    // add line of text
    var hitId = createLineHIT(text, syllables, 0.02)
    var hit = mturk.waitForHIT(hitId)
    
    var newText = hit.assignments[0].answer.newText
    print("-------------------")
    print(newText)
    print("-------------------")
    
    // verify line
    if (vote(newText, syllables, 0.01)) {
        text += newText + '\n'
        mturk.approveAssignment(hit.assignments[0])
        print("\nvote = keep\n")
	lineNumber++;
    } else {
        mturk.rejectAssignment(hit.assignments[0])
        print("\nvote = reject\n")
    }

    if(lineNumber == 4){
        //Haiku successfully created
	//Write completed haiku to output and to file
	print("-------------------");
	print("Completed Haiku:");
	print("*******************");
	print(text);
	print("-------------------");
	//Set variables back to original values
	text = "";
	lineNumber = 1;
    }
}


function createLineHIT(oldText, syllableCount, improveCost) {
    default xml namespace = "http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/QuestionForm.xsd";
    var q = <QuestionForm>
        <Question>
            <QuestionIdentifier>newText</QuestionIdentifier>
            <IsRequired>true</IsRequired>
            <QuestionContent>
		<Text>Please add a {syllableCount} syllable line to the haiku. (Other people will check for the correct syllable count.)</Text>
                <Text>Current poem:</Text>
		<Text>{text}</Text>
            </QuestionContent>
            <AnswerSpecification>
                <FreeTextAnswer>
                    <Constraints>
                        <Length minLength="2" maxLength="500"></Length>
                        <AnswerFormatRegex regex="\S" errorText="The content cannot be blank."/>
                    </Constraints>
                    <NumberOfLinesSuggestion>3</NumberOfLinesSuggestion>
                </FreeTextAnswer>
            </AnswerSpecification>
        </Question>
    </QuestionForm>
    
    return mturk.createHIT({title : "Write Poetry", desc : "Add a " + syllableCount + " syllable line.", question : "" + q, reward : improveCost, assignmentDurationInSeconds : 5 * 60})
}


function vote(newText, syllableCount, voteCost) {
    default xml namespace = "http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/QuestionForm.xsd";
    var q = <QuestionForm>
        <Question>
            <QuestionIdentifier>vote</QuestionIdentifier>
            <IsRequired>true</IsRequired>
            <QuestionContent>
                <Text>Does this line have {syllableCount} syllables?</Text>
		<Text>{newText}</Text>
            </QuestionContent>
            <AnswerSpecification>
                <SelectionAnswer>
                    <Selections>
                    </Selections>
                </SelectionAnswer>
            </AnswerSpecification>
        </Question>
    </QuestionForm>

    var options = [{key:"true",value:"True"}, {key:"false",value:"False"}]
    foreach(options, function (op) {
        default xml namespace = "http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/QuestionForm.xsd";
        q.Question.AnswerSpecification.SelectionAnswer.Selections.Selection +=
            <Selection>
                <SelectionIdentifier>{op.key}</SelectionIdentifier>
                <Text>{op.value}</Text>
            </Selection>
    })
    var voteHitId = mturk.createHIT({title : "Vote on poetry", desc : "Decide if a line in the haiku has correct number of syllables.", question : "" + q,  reward : voteCost, maxAssignments : 1})
    var voteResults = mturk.vote(voteHitId, function (answer) {return answer.vote[0]})
    return voteResults.bestOption == "true"
}