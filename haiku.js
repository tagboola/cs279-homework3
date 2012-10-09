//initialize variables
var text = "";
var lineNumber = 1;
var count = 0;
var categories = ["nature","pets","love"];
var categoryImageHash = new Object();
categoryImageHash["nature"] = "http://4.bp.blogspot.com/-7QvOlSOMb7o/UDF9a5Ed2_I/AAAAAAAAAEw/jXg6SofifjI/s1600/56793-nature-reserve-screensaver%255B1%255D.jpg";
categoryImageHash["pets"] = "http://newpuppytrainingsecrets.com/wp-content/uploads/2010/06/1104607golden-retriever-puppy-and-kitten-posters.jpg";
categoryImageHash["love"] = "http://dannaww.files.wordpress.com/2011/09/love.jpg";
	
while (lineNumber < 4) {
    var syllables = 5;
    if (lineNumber == 2) {
	syllables = 7;
    }
	
    // add line of text
    var hitId = createLineHIT(text, syllables, 0.02,categoryImageHash[categories[count%categories.length]]);
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
	var outputString = "-------------------\nCompleted Haiku\nCategory: "+categories[count % categories.length]+"\n";
	outputString += "*******************\n"+text+"-------------------\n";
	print(outputString);
	write("haiku" + count + ".txt", outputString);
	//Set variables back to original values
	count += 1;
	text = "";
	lineNumber = 1;
    }
}


function createLineHIT(oldText, syllableCount, improveCost, imgSrc) {
    default xml namespace = "http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/QuestionForm.xsd";
    var q = <QuestionForm>
        <Question>
            <QuestionIdentifier>newText</QuestionIdentifier>
            <IsRequired>true</IsRequired>
            <QuestionContent>
		<Binary>
  			<MimeType>
    				<Type>image</Type>
    				<SubType>gif</SubType>
  			</MimeType>
  			<DataURL></DataURL>
			<AltText>The game board, with "X" to move.</AltText>
		</Binary>
		<Text>Please add a {syllableCount} syllable line for a haiku about the picture above. (Other people will check for the correct syllable count.)</Text>
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
    q.Question.QuestionContent.Binary.DataURL = imgSrc;
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