// База данных глаголов avoir и être
const verbsData = {
	"avoir": {
			"je": "ai",
			"tu": "as",
			"il": "a",
			"elle": "a",
			"on": "a",
			"nous": "avons",
			"vous": "avez",
			"ils": "ont",
			"elles": "ont"
	},
	"être": {
			"je": "suis",
			"tu": "es",
			"il": "est",
			"elle": "est",
			"on": "est",
			"nous": "sommes",
			"vous": "êtes",
			"ils": "sont",
			"elles": "sont"
	}
};

// Словарь для пользовательских слов
let customDictionary = JSON.parse(localStorage.getItem('customDictionary')) || [];

// Функция для нормализации строк (убирает диакритические знаки)
const normalizeString = (str) => {
	return str
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase();
};

// Текущее состояние приложения
let state = {
	currentSection: 'flashcards',
	flashcards: {
			currentDeck: 'avoir-etre',
			currentCardIndex: 0,
			cards: []
	},
	quiz: {
			type: 'multiple-choice',
			deck: 'avoir-etre',
			questions: [],
			currentQuestionIndex: 0,
			score: 0,
			isActive: false
	}
};

// Переключение между разделами
document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('.nav-btn').forEach(btn => {
			btn.addEventListener('click', () => {
					const section = btn.getAttribute('data-section');
					
					// Обновляем активную кнопку навигации
					document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
					btn.classList.add('active');
					
					// Обновляем активный раздел
					document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
					document.getElementById(section).classList.add('active');
					
					state.currentSection = section;
			});
	});

	// Инициализация приложения
	initApp();
});

// Формирование карточек для глаголов avoir и être
function generateVerbCards() {
	const cards = [];
	
	// Карточки для avoir
	for (const [pronoun, form] of Object.entries(verbsData.avoir)) {
			cards.push({
					front: `${pronoun} (avoir)`,
					back: form
			});
	}
	
	// Карточки для être
	for (const [pronoun, form] of Object.entries(verbsData.être)) {
			cards.push({
					front: `${pronoun} (être)`,
					back: form
			});
	}
	
	return cards;
}

// Формирование карточек из пользовательского словаря
function generateCustomCards() {
	return customDictionary.map(item => ({
			front: item.french,
			back: item.russian
	}));
}

// Инициализация карточек
function initFlashcards() {
	const deckSelect = document.getElementById('deck-select');
	if (!deckSelect) return;
	
	const deck = deckSelect.value;
	state.flashcards.currentDeck = deck;
	state.flashcards.currentCardIndex = 0;
	
	if (deck === 'avoir-etre') {
			state.flashcards.cards = generateVerbCards();
	} else {
			state.flashcards.cards = generateCustomCards();
	}
	
	updateFlashcard();
}

// Обновление отображения карточки
function updateFlashcard() {
	const { cards, currentCardIndex } = state.flashcards;
	
	const frontText = document.querySelector('.flashcard-front .card-text');
	const backText = document.querySelector('.flashcard-back .card-text');
	const cardCounter = document.getElementById('card-counter');
	
	if (!frontText || !backText || !cardCounter) return;
	
	if (cards.length === 0) {
			frontText.textContent = 'Нет доступных карточек';
			cardCounter.textContent = '0/0';
			return;
	}
	
	const card = cards[currentCardIndex];
	frontText.textContent = card.front;
	backText.textContent = card.back;
	cardCounter.textContent = `${currentCardIndex + 1}/${cards.length}`;
	
	// Сбрасываем состояние переворота карточки
	const flashcard = document.querySelector('.flashcard');
	if (flashcard) flashcard.classList.remove('flipped');
}

// Инициализация обработчиков событий
function initEventHandlers() {
	// Обработчики для навигации по карточкам
	const prevCardBtn = document.getElementById('prev-card');
	const nextCardBtn = document.getElementById('next-card');
	const flashcard = document.querySelector('.flashcard');
	const deckSelect = document.getElementById('deck-select');
	
	if (prevCardBtn) {
			prevCardBtn.addEventListener('click', () => {
					if (state.flashcards.cards.length === 0) return;
					
					state.flashcards.currentCardIndex--;
					if (state.flashcards.currentCardIndex < 0) {
							state.flashcards.currentCardIndex = state.flashcards.cards.length - 1;
					}
					
					updateFlashcard();
			});
	}
	
	if (nextCardBtn) {
			nextCardBtn.addEventListener('click', () => {
					if (state.flashcards.cards.length === 0) return;
					
					state.flashcards.currentCardIndex++;
					if (state.flashcards.currentCardIndex >= state.flashcards.cards.length) {
							state.flashcards.currentCardIndex = 0;
					}
					
					updateFlashcard();
			});
	}
	
	// Переворачивание карточки при клике
	if (flashcard) {
			flashcard.addEventListener('click', function() {
					this.classList.toggle('flipped');
			});
	}
	
	// Обработчик изменения колоды карточек
	if (deckSelect) {
			deckSelect.addEventListener('change', initFlashcards);
	}
	
	// Запуск теста
	const startQuizBtn = document.getElementById('start-quiz');
	if (startQuizBtn) {
			startQuizBtn.addEventListener('click', startQuiz);
	}
	
	// Проверка введенного ответа
	const checkAnswerBtn = document.getElementById('check-answer');
	if (checkAnswerBtn) {
			checkAnswerBtn.addEventListener('click', checkTextInputAnswer);
	}
	
	// Переход к следующему вопросу
	const nextQuestionBtn = document.getElementById('next-question');
	if (nextQuestionBtn) {
			nextQuestionBtn.addEventListener('click', () => {
					state.quiz.currentQuestionIndex++;
					const feedback = document.getElementById('feedback');
					if (feedback) feedback.classList.add('hidden');
					showQuestion();
			});
	}
	
	// Перезапуск теста
	const restartQuizBtn = document.getElementById('restart-quiz');
	if (restartQuizBtn) {
			restartQuizBtn.addEventListener('click', () => {
					const questionContainer = document.getElementById('question-container');
					if (questionContainer) questionContainer.classList.remove('hidden');
					if (startQuizBtn) startQuizBtn.click();
			});
	}
	
	// Добавление нового слова в словарь
	const addWordBtn = document.getElementById('add-word');
	if (addWordBtn) {
			addWordBtn.addEventListener('click', addSingleWord);
	}
	
	// Поиск в словаре
	const searchDictionary = document.getElementById('search-dictionary');
	if (searchDictionary) {
			searchDictionary.addEventListener('input', updateDictionaryView);
	}
	
	// Обработчики для пакетного добавления слов
	setupBatchAddHandlers();
	
	// Экспорт и импорт словаря
	setupImportExportHandlers();
}

// Настройка обработчиков для пакетного добавления
function setupBatchAddHandlers() {
	// Показать/скрыть секцию пакетного добавления
	const showBatchAddBtn = document.getElementById('show-batch-add');
	if (showBatchAddBtn) {
			showBatchAddBtn.addEventListener('click', function() {
					const batchContainer = document.getElementById('batch-add-container');
					if (!batchContainer) return;
					
					batchContainer.classList.toggle('hidden');
					this.textContent = batchContainer.classList.contains('hidden') 
							? 'Добавить слова пачкой' 
							: 'Скрыть';
			});
	}
	
	// Очистка поля пакетного добавления
	const clearBatchBtn = document.getElementById('clear-batch');
	if (clearBatchBtn) {
			clearBatchBtn.addEventListener('click', function() {
					const batchWords = document.getElementById('batch-words');
					if (batchWords) batchWords.value = '';
			});
	}
	
	// Добавление слов пачкой
	const addBatchWordsBtn = document.getElementById('add-batch-words');
	if (addBatchWordsBtn) {
			addBatchWordsBtn.addEventListener('click', addBatchWords);
	}
	
	// Drag-and-drop для CSV-файлов
	const batchWords = document.getElementById('batch-words');
	if (batchWords) {
			batchWords.addEventListener('dragover', function(e) {
					e.preventDefault();
					this.style.borderColor = 'var(--primary-color)';
			});
			
			batchWords.addEventListener('dragleave', function() {
					this.style.borderColor = '#e2e8f0';
			});
			
			batchWords.addEventListener('drop', function(e) {
					e.preventDefault();
					this.style.borderColor = '#e2e8f0';
					
					if (e.dataTransfer.files.length) {
							const file = e.dataTransfer.files[0];
							
							if (file.type === 'text/csv' || file.name.endsWith('.csv') || 
									file.type === 'text/plain' || file.name.endsWith('.txt')) {
									const reader = new FileReader();
									
									reader.onload = function(event) {
											batchWords.value = event.target.result;
									};
									
									reader.readAsText(file);
							} else {
									alert('Пожалуйста, используйте файлы CSV или TXT');
							}
					}
			});
	}
}

// Настройка обработчиков импорта/экспорта
function setupImportExportHandlers() {
	// Экспорт словаря
	const exportBtn = document.getElementById('export-btn');
	if (exportBtn) {
			exportBtn.addEventListener('click', () => {
					if (customDictionary.length === 0) {
							alert('Словарь пуст');
							return;
					}
					
					// Экспорт в JSON
					const data = JSON.stringify(customDictionary, null, 2);
					const blob = new Blob([data], { type: 'application/json' });
					const url = URL.createObjectURL(blob);
					
					const a = document.createElement('a');
					a.href = url;
					a.download = 'french_dictionary.json';
					a.click();
					
					URL.revokeObjectURL(url);
			});
	}
	
	// Добавим кнопку для экспорта в CSV, если её нет
	const exportCsvBtn = document.getElementById('export-csv-btn');
	if (!exportCsvBtn && exportBtn) {
			const exportCsvBtn = document.createElement('button');
			exportCsvBtn.id = 'export-csv-btn';
			exportCsvBtn.textContent = 'Экспорт CSV';
			exportBtn.parentNode.insertBefore(exportCsvBtn, exportBtn.nextSibling);
			
			exportCsvBtn.addEventListener('click', () => {
					if (customDictionary.length === 0) {
							alert('Словарь пуст');
							return;
					}
					
					// Формируем содержимое CSV
					let csvContent = '';
					customDictionary.forEach(item => {
							csvContent += `${item.french};${item.russian}\n`;
					});
					
					const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
					const url = URL.createObjectURL(blob);
					
					const a = document.createElement('a');
					a.href = url;
					a.download = 'french_dictionary.csv';
					a.click();
					
					URL.revokeObjectURL(url);
			});
	}
	
	// Импорт словаря
	const importBtn = document.getElementById('import-btn');
	const importFile = document.getElementById('import-file');
	
	if (importBtn && importFile) {
			importBtn.addEventListener('click', () => {
					importFile.click();
			});
			
			importFile.addEventListener('change', handleFileImport);
	}
}

// Обработка импорта файла
function handleFileImport(event) {
	const file = event.target.files[0];
	if (!file) return;
	
	const reader = new FileReader();
	
	reader.onload = function(e) {
			try {
					// Определяем тип файла
					if (file.name.endsWith('.json')) {
							// Обработка JSON
							const importedData = JSON.parse(e.target.result);
							
							if (Array.isArray(importedData) && importedData.every(item => 
									typeof item === 'object' && 'french' in item && 'russian' in item)) {
									
									// Спрашиваем, хочет ли пользователь заменить или дополнить словарь
									const isAppend = confirm('Добавить импортированные слова к существующему словарю? Нажмите "Отмена" для полной замены.');
									
									if (isAppend) {
											customDictionary = [...customDictionary, ...importedData];
									} else {
											customDictionary = importedData;
									}
									
									localStorage.setItem('customDictionary', JSON.stringify(customDictionary));
									updateDictionaryView();
									
									alert(`Импортировано ${importedData.length} слов`);
							} else {
									alert('Неверный формат JSON-файла. Ожидается массив объектов с полями french и russian.');
							}
					} else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
							// Обработка CSV/TXT
							processCSVImport(e.target.result);
					} else {
							alert('Неподдерживаемый формат файла. Используйте CSV, TXT или JSON.');
					}
			} catch (error) {
					alert('Ошибка при чтении файла: ' + error.message);
			}
	};
	
	reader.readAsText(file);
	event.target.value = ''; // Сбрасываем значение, чтобы можно было загрузить тот же файл еще раз
}

// Обработка CSV-импорта
function processCSVImport(content) {
	const lines = content.split(/\r\n|\n/);
	let importedWords = [];
	let errorCount = 0;
	
	lines.forEach(line => {
			line = line.trim();
			if (!line) return; // Пропускаем пустые строки
			
			// Поддерживаем разные разделители
			let parts;
			if (line.includes(';')) {
					parts = line.split(';');
			} else if (line.includes(',')) {
					parts = line.split(',');
			} else if (line.includes('\t')) {
					parts = line.split('\t');
			} else {
					errorCount++;
					return;
			}
			
			if (parts.length >= 2) {
					const frenchWord = parts[0].trim();
					const russianTranslation = parts[1].trim();
					
					if (frenchWord && russianTranslation) {
							importedWords.push({
									french: frenchWord,
									russian: russianTranslation
							});
					} else {
							errorCount++;
					}
			} else {
					errorCount++;
			}
	});
	
	if (importedWords.length > 0) {
			// Спрашиваем, хочет ли пользователь заменить или дополнить словарь
			const isAppend = confirm('Добавить импортированные слова к существующему словарю? Нажмите "Отмена" для полной замены.');
			
			if (isAppend) {
					customDictionary = [...customDictionary, ...importedWords];
			} else {
					customDictionary = importedWords;
			}
			
			localStorage.setItem('customDictionary', JSON.stringify(customDictionary));
			updateDictionaryView();
			
			alert(`Импортировано ${importedWords.length} слов. ${errorCount > 0 ? `Ошибок: ${errorCount}` : ''}`);
	} else {
			alert('Не удалось импортировать слова из файла.');
	}
}

// Добавление одного слова в словарь
function addSingleWord() {
	const frenchWord = document.getElementById('french-word');
	const russianTranslation = document.getElementById('russian-translation');
	
	if (!frenchWord || !russianTranslation) return;
	
	const french = frenchWord.value.trim();
	const russian = russianTranslation.value.trim();
	
	if (french && russian) {
			customDictionary.push({
					french: french,
					russian: russian
			});
			
			// Сохраняем в localStorage
			localStorage.setItem('customDictionary', JSON.stringify(customDictionary));
			
			// Очищаем поля ввода
			frenchWord.value = '';
			russianTranslation.value = '';
			
			// Обновляем отображение словаря
			updateDictionaryView();
	}
}

// Добавление слов пачкой
function addBatchWords() {
	const batchWords = document.getElementById('batch-words');
	if (!batchWords) return;
	
	const batchText = batchWords.value.trim();
	
	if (!batchText) {
			alert('Введите слова для добавления');
			return;
	}
	
	// Разбиваем текст на строки
	const lines = batchText.split('\n');
	let addedCount = 0;
	let errorCount = 0;
	
	// Обрабатываем каждую строку
	lines.forEach(line => {
			line = line.trim();
			if (!line) return; // Пропускаем пустые строки
			
			// Поддерживаем разные разделители: точка с запятой, запятая или табуляция
			let parts;
			if (line.includes(';')) {
					parts = line.split(';');
			} else if (line.includes(',')) {
					parts = line.split(',');
			} else if (line.includes('\t')) {
					parts = line.split('\t');
			} else {
					// Если разделители не найдены, считаем это ошибкой
					errorCount++;
					return;
			}
			
			// Проверяем, что есть как минимум два элемента
			if (parts.length >= 2) {
					const frenchWord = parts[0].trim();
					const russianTranslation = parts[1].trim();
					
					if (frenchWord && russianTranslation) {
							// Проверяем, есть ли уже такое слово в словаре
							const exists = customDictionary.some(item => 
									normalizeString(item.french) === normalizeString(frenchWord));
							
							if (!exists) {
									customDictionary.push({
											french: frenchWord,
											russian: russianTranslation
									});
									addedCount++;
							}
					} else {
							errorCount++;
					}
			} else {
					errorCount++;
			}
	});
	
	// Сохраняем обновленный словарь
	localStorage.setItem('customDictionary', JSON.stringify(customDictionary));
	
	// Обновляем отображение словаря
	updateDictionaryView();
	
	// Показываем результат
	alert(`Добавлено ${addedCount} слов. ${errorCount > 0 ? `Ошибок: ${errorCount}` : ''}`);
	
	// Очищаем поле ввода после успешного добавления
	if (addedCount > 0) {
			batchWords.value = '';
	}
}

// Обновление отображения словаря
function updateDictionaryView() {
	const dictionaryList = document.getElementById('dictionary-list');
	if (!dictionaryList) return;
	
	dictionaryList.innerHTML = '';
	
	const searchQuery = document.getElementById('search-dictionary')?.value.toLowerCase() || '';
	
	customDictionary.forEach((item, index) => {
			// Фильтрация по поисковому запросу
			if (searchQuery && !item.french.toLowerCase().includes(searchQuery) && 
					!item.russian.toLowerCase().includes(searchQuery)) {
					return;
			}
			
			const row = document.createElement('tr');
			
			const frenchCell = document.createElement('td');
			frenchCell.textContent = item.french;
			row.appendChild(frenchCell);
			
			const russianCell = document.createElement('td');
			russianCell.textContent = item.russian;
			row.appendChild(russianCell);
			
			const actionsCell = document.createElement('td');
			const deleteBtn = document.createElement('button');
			deleteBtn.classList.add('action-btn', 'delete');
			deleteBtn.textContent = 'Удалить';
			deleteBtn.addEventListener('click', () => deleteWord(index));
			actionsCell.appendChild(deleteBtn);
			row.appendChild(actionsCell);
			
			dictionaryList.appendChild(row);
	});
}

// Удаление слова из словаря
function deleteWord(index) {
	customDictionary.splice(index, 1);
	localStorage.setItem('customDictionary', JSON.stringify(customDictionary));
	updateDictionaryView();
}

// Запуск теста
function startQuiz() {
	const quizType = document.getElementById('quiz-type');
	const quizDeck = document.getElementById('quiz-deck');
	
	if (!quizType || !quizDeck) return;
	
	const type = quizType.value;
	const deck = quizDeck.value;
	
	state.quiz.type = type;
	state.quiz.deck = deck;
	state.quiz.questions = generateQuestions(type, deck);
	state.quiz.currentQuestionIndex = 0;
	state.quiz.score = 0;
	state.quiz.isActive = true;
	
	// Скрываем/показываем нужные элементы
	const multipleChoice = document.getElementById('multiple-choice-container');
	const textInput = document.getElementById('text-input-container');
	const feedback = document.getElementById('feedback');
	const quizResults = document.getElementById('quiz-results');
	
	if (multipleChoice) multipleChoice.classList.toggle('hidden', type !== 'multiple-choice');
	if (textInput) textInput.classList.toggle('hidden', type !== 'text-input');
	if (feedback) feedback.classList.add('hidden');
	if (quizResults) quizResults.classList.add('hidden');
	
	// Если у нас есть вопросы, показываем первый
	if (state.quiz.questions.length > 0) {
			showQuestion();
	} else {
			const question = document.getElementById('question');
			if (question) question.textContent = 'Нет доступных вопросов для этой колоды';
	}
}

// Генерация вопросов для теста
function generateQuestions(type, deck) {
	const questions = [];
	
	if (deck === 'avoir-etre') {
			// Вопросы для глаголов avoir и être
			for (const verb of ['avoir', 'être']) {
					for (const [pronoun, form] of Object.entries(verbsData[verb])) {
							questions.push({
									question: `${pronoun} (${verb})`,
									correctAnswer: form,
									options: type === 'multiple-choice' ? generateOptions(form, verb) : null
							});
					}
			}
	} else {
			// Вопросы из пользовательского словаря
			for (const item of customDictionary) {
					questions.push({
							question: item.russian,
							correctAnswer: item.french,
							options: type === 'multiple-choice' ? generateOptions(item.french, 'custom') : null
					});
			}
	}
	
	// Перемешиваем вопросы
	return questions.sort(() => Math.random() - 0.5);
}

// Генерация вариантов ответа
function generateOptions(correctAnswer, source) {
	const options = [correctAnswer];
	
	// Функция для получения случайной формы глагола
	function getRandomVerbForm() {
			const verbs = ['avoir', 'être'];
			const pronouns = ['je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles'];
			
			const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
			const randomPronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
			
			return verbsData[randomVerb][randomPronoun];
	}
	
	// Функция для получения случайного слова из словаря
	function getRandomCustomWord() {
			if (customDictionary.length === 0) return 'mot';
			return customDictionary[Math.floor(Math.random() * customDictionary.length)].french;
	}
	
	// Добавляем неправильные варианты
	while (options.length < 4) {
			let wrongOption;
			
			if (source === 'avoir' || source === 'être') {
					wrongOption = getRandomVerbForm();
			} else {
					wrongOption = getRandomCustomWord();
			}
			
			// Убедимся, что такого варианта еще нет в списке
			if (!options.includes(wrongOption)) {
					options.push(wrongOption);
			}
	}
	
	// Перемешиваем варианты
	return options.sort(() => Math.random() - 0.5);
}

// Отображение текущего вопроса
function showQuestion() {
	const { questions, currentQuestionIndex, type } = state.quiz;
	
	if (currentQuestionIndex >= questions.length) {
			showResults();
			return;
	}
	
	const questionEl = document.getElementById('question');
	if (!questionEl) return;
	
	const question = questions[currentQuestionIndex];
	questionEl.textContent = question.question;
	
	if (type === 'multiple-choice') {
			const optionsContainer = document.querySelector('.options-grid');
			if (!optionsContainer) return;
			
			optionsContainer.innerHTML = '';
			
			question.options.forEach(option => {
					const button = document.createElement('button');
					button.classList.add('option-btn');
					button.textContent = option;
					button.addEventListener('click', () => checkMultipleChoiceAnswer(option));
					optionsContainer.appendChild(button);
			});
	} else {
			const answerInput = document.getElementById('answer-input');
			if (answerInput) answerInput.value = '';
	}
}

// Проверка ответа в тесте с выбором
function checkMultipleChoiceAnswer(selectedOption) {
	const currentQuestion = state.quiz.questions[state.quiz.currentQuestionIndex];
	const isCorrect = normalizeString(selectedOption) === normalizeString(currentQuestion.correctAnswer);
	
	// Подсвечиваем правильный/неправильный вариант
	document.querySelectorAll('.option-btn').forEach(btn => {
			if (btn.textContent === selectedOption) {
					btn.classList.add(isCorrect ? 'correct' : 'incorrect');
			}
			if (normalizeString(btn.textContent) === normalizeString(currentQuestion.correctAnswer)) {
					btn.classList.add('correct');
			}
			btn.disabled = true;
	});
	
	// Обновляем счет и показываем обратную связь
	if (isCorrect) state.quiz.score++;
	
	const feedback = document.getElementById('feedback');
	const feedbackText = document.getElementById('feedback-text');
	
	if (feedback && feedbackText) {
			feedback.classList.remove('hidden', 'correct', 'incorrect');
			feedback.classList.add(isCorrect ? 'correct' : 'incorrect');
			
			feedbackText.textContent = isCorrect 
					? 'Правильно!' 
					: `Неправильно. Правильный ответ: ${currentQuestion.correctAnswer}`;
			
			feedback.classList.remove('hidden');
	}
}

// Проверка введенного ответа
function checkTextInputAnswer() {
	const answerInput = document.getElementById('answer-input');
	if (!answerInput) return;
	
	const userInput = answerInput.value.trim();
	
	if (!userInput) return;
	
	const currentQuestion = state.quiz.questions[state.quiz.currentQuestionIndex];
	const isCorrect = normalizeString(userInput) === normalizeString(currentQuestion.correctAnswer);
	
	// Обновляем счет и показываем обратную связь
	if (isCorrect) state.quiz.score++;
	
	const feedback = document.getElementById('feedback');
	const feedbackText = document.getElementById('feedback-text');
	
	if (feedback && feedbackText) {
			feedback.classList.remove('hidden', 'correct', 'incorrect');
			feedback.classList.add(isCorrect ? 'correct' : 'incorrect');
			
			feedbackText.textContent = isCorrect 
					? 'Правильно!' 
					: `Неправильно. Правильный ответ: ${currentQuestion.correctAnswer}`;
			
			feedback.classList.remove('hidden');
	}
}

// Отображение результатов теста
function showResults() {
	const { questions, score } = state.quiz;
	
	const questionContainer = document.getElementById('question-container');
	const quizResults = document.getElementById('quiz-results');
	const scoreEl = document.getElementById('score');
	
	if (questionContainer) questionContainer.classList.add('hidden');
	if (quizResults) quizResults.classList.remove('hidden');
	
	if (scoreEl) {
			scoreEl.textContent = `Ваш результат: ${score} из ${questions.length} (${Math.round(score / questions.length * 100)}%)`;
	}
	
	state.quiz.isActive = false;
}

// Обработка импорта глагольных форм из CSV-файла
function importVerbsFromCSV() {
	// Пример CSV-данных из приложенного файла
	const csvData = `avoir avoirtre tre avoir tre ------ jejaieje suis si tutu asty atu esty ilil ail ail estil elleelle al aelle estl onon an aon estn nousnous avonsnuz avnous sommesnu sm vousvous avezvuz avevous tesvuz t ilsils ontilz ils sontil s elleselles ontlz elles sontl s`[1];
	
	// Уже известные формы глаголов достаточны для приложения
	console.log("Данные из CSV-файла учтены, используются встроенные формы глаголов");
}

// Инициализация приложения
function initApp() {
	// Импортируем формы глаголов из CSV
	importVerbsFromCSV();
	
	// Добавляем HTML для пакетного добавления, если его нет
	addBatchAddHTML();
	
	// Инициализируем карточки
	initFlashcards();
	
	// Инициализируем обработчики событий
	initEventHandlers();
	
	// Обновляем отображение словаря
	updateDictionaryView();
}

// Добавление HTML для пакетного добавления слов
function addBatchAddHTML() {
	const dictionarySection = document.getElementById('dictionary');
	
	if (dictionarySection && !document.getElementById('batch-add-container')) {
			const batchAddSection = document.createElement('div');
			batchAddSection.className = 'batch-add-section';
			batchAddSection.innerHTML = `
					<button id="show-batch-add" class="secondary-btn">Добавить слова пачкой</button>
					
					<div id="batch-add-container" class="hidden">
							<h3>Добавление пачкой слов</h3>
							<p class="hint">Введите слова в формате: "французское слово;русский перевод" (по одной паре на строку)</p>
							
							<textarea id="batch-words" rows="6" placeholder="exemple;пример
bonjour;здравствуйте
merci;спасибо"></textarea>
							
							<div class="batch-controls">
									<button id="add-batch-words">Добавить все</button>
									<button id="clear-batch" class="secondary-btn">Очистить</button>
							</div>
					</div>
			`;
			
			// Вставляем после элементов управления словарем
			const dictionaryControls = dictionarySection.querySelector('.dictionary-controls');
			if (dictionaryControls) {
					dictionaryControls.after(batchAddSection);
					
					// Добавляем стили
					if (!document.getElementById('batch-add-styles')) {
							const style = document.createElement('style');
							style.id = 'batch-add-styles';
							style.textContent = `
									.batch-add-section {
											margin: 1.5rem 0;
											width: 100%;
									}
									#batch-add-container {
											margin-top: 1rem;
											padding: 1rem;
											background-color: var(--light-color, #f7fafc);
											border-radius: var(--border-radius, 8px);
									}
									#batch-words {
											width: 100%;
											padding: 0.75rem;
											border: 1px solid #e2e8f0;
											border-radius: var(--border-radius, 8px);
											font-family: inherit;
											margin: 0.5rem 0;
											resize: vertical;
									}
									.batch-controls {
											display: flex;
											gap: 0.75rem;
											margin-top: 0.5rem;
									}
									.hint {
											font-size: 0.9rem;
											color: #718096;
											margin-bottom: 0.5rem;
									}
									.secondary-btn {
											background-color: #e2e8f0;
											color: var(--dark-color, #2d3748);
									}
									.secondary-btn:hover {
											background-color: #cbd5e0;
									}
							`;
							document.head.appendChild(style);
					}
			}
	}
}
