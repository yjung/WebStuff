var questions;
var x3dObjects;

var activeBlock;
var activeQuestion;

$(document).ready(function() {
	
	$('#startalizer').height($('#startalizer').height() - 45 + 'px');
	
	$('#loadQuestions').click(function() {
		
		$.getJSON( "questions/questions2.js", function( data ) {
		
			questions = data;
			loadQuestions();
			
			$('#startalizer').hide();
			$('#myheader a').removeClass('ui-disabled');
		
		}).fail(function( jqxhr, textStatus, error ) {
			alert( "Request Failed: " + textStatus + ", " + error );
		});
		
	});
	
	$('#validateAnswer').click(function() {
		if(checkAnswer()) {
			$('#questionBoard').css({
				'background': '#2ecc71',
				'color': '#ffffff'
			});
			if(!loadNextQuestion())
				finalize();
		}
		else {
			$('#questionBoard').css({
				'background': '#e74c3c',
				'color': '#ffffff'
			});
		}
	});
	
});

function initInline() {
	$('#test__theScene').find('Group').click(function() {

		var objThis = $(this).attr('id');
	
		$('#test__theScene').find('Group').each(function() {
			if($(this).attr('id') != objThis)
				$(this).find('Appearance Material').attr('diffuseColor', 'gray');
		});
	
		var obj = $(this).find('Appearance Material');
	
		if($(obj).attr('diffuseColor') == '#3498db') {
			$(obj).attr('diffuseColor', 'gray');
			$('#questionTips').empty();
		} else {
			$(obj).attr('diffuseColor', '#3498db');
			showObjInfo($(this).attr('id'));
		}
	});
}

function loadQuestions() {
	$('#questions ul').empty();
	
	var questionCount = 0;
	$.each(questions, function(i, item) {
		$.each(item.fragen, function(j, fragen) {
			var summe = parseInt(i) + parseInt(j);
			$('#questions ul').append('<li data-block="' + i + '" data-number="' + summe + '">' + fragen.frage + '<span></span></li>');
			questionCount++;
		});
	});
	
	//update number of questions in "Fragen - Button"
	$('#myheader a span').html('(' + questionCount + ')');
	
	//disable "Fragen laden"-Button
	$('#loadQuestions').addClass('ui-disabled');
	$('#validateAnswer').removeClass('ui-disabled');
	
	//Erste Frage laden
	loadNextQuestion();
}

function loadNextQuestion() {
	//active question number | next question number
	var aqn = parseInt($('#questions li.active').attr('data-number'));
	var nqn = aqn;
	
	//active block number
	var abn = parseInt($('#questions li.active').attr('data-block')) + 1;
	
	if(!$('#questions li.active').length) {
		nqn = 0;
		abn = 1;
	}
	
	if(typeof questions[abn] == 'undefined')
		return false
	
	//aktive Frage setzen
	activeBlock = questions[abn];
	activeQuestion = questions[abn].fragen[0];
	
	//Fragebereich aktualisieren
	$('#questionContent .question').html('<span>Frage ' + abn + ':</span> '+ activeQuestion.frage);
	$('#questionContent .info span').html('Antwort in ' + activeQuestion.einheit);
	$('#questionContent .formel span').html(activeQuestion.formel);
	
	//Sidebar aktualisieren
	$('#questions li.active').removeClass('active');
	$('#questions li[data-number="' + abn + '"]').addClass('active');
	
	//Model aktualisieren
	$('#the3DContent inline').attr('url', 'models/' + activeBlock.model + '.x3d');
	
	//Clear Input
	$('#questionContent input[name="answer"]').val('');
	
	//Clear Question Tip
	$('#questionTips').empty();
	
	setTimeout(function(){
		$('#questionBoard').css({
			'background': '#bdc3c7',
			'color': '#333'
		});
	}, 400);
	
	return true;
}

function showObjInfo(obj) {
	$('#questionTips').empty();
	$('#questionTips').append('<h4>' + obj + '</h4><table></table>');
	
	var groupDef = obj.replace(/test__/g, '');
	
	$.each(activeBlock.tips[groupDef], function(i, tip) {
		$('#questionTips table').append('<tr><td>' + tip.name + '</td><td>' + tip.wert + '</td></tr>');
	});
}

function checkAnswer() {
	var userAnswer = $('#questionContent input[name="answer"]').val();
	
	if(userAnswer == activeQuestion.ergebnis)
		return true;
		
	return false;
}

function finalize() {
	$('body').append('<div id="finalizer"></div>');
}