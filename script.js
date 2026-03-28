const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const transcribeBtn = document.getElementById('transcribeBtn');
const player = document.getElementById('player');
const downloadLink = document.getElementById('downloadLink');
const transcriptBox = document.getElementById('transcript');
const buildListBtn = document.getElementById('buildListBtn');
const todoList = document.getElementById('todoList');
const statusText = document.getElementById('status');

let mediaRecorder;
let recordedChunks = [];
let audioBlob;

const speechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!navigator.mediaDevices?.getUserMedia) {
  setStatus('Your browser does not support microphone recording.');
  recordBtn.disabled = true;
}

if (!speechRecognitionClass) {
  transcribeBtn.disabled = true;
  setStatus('Speech recognition is not available in this browser. You can type tasks manually.');
}

recordBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
transcribeBtn.addEventListener('click', transcribeAudio);
buildListBtn.addEventListener('click', () => createTodoItems(transcriptBox.value));

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    });

    mediaRecorder.addEventListener('stop', () => {
      audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      player.src = audioUrl;
      downloadLink.href = audioUrl;
      downloadLink.hidden = false;
      transcribeBtn.disabled = !speechRecognitionClass;
      setStatus('Recording ready. Click “Transcribe from recording” to convert speech into tasks.');
      stream.getTracks().forEach((track) => track.stop());
    });

    mediaRecorder.start();
    recordBtn.disabled = true;
    stopBtn.disabled = false;
    transcribeBtn.disabled = true;
    setStatus('Recording… speak your tasks clearly.');
  } catch (error) {
    setStatus(`Could not access microphone: ${error.message}`);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    recordBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

function transcribeAudio() {
  if (!speechRecognitionClass) {
    setStatus('Speech recognition is unsupported in this browser.');
    return;
  }

  const recognition = new speechRecognitionClass();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  setStatus('Listening for task speech…');

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript;
    transcriptBox.value = spokenText;
    setStatus('Transcript created. Now build your to-do list.');
    createTodoItems(spokenText);
  };

  recognition.onerror = (event) => {
    setStatus(`Transcription failed: ${event.error}. You can type tasks manually.`);
  };

  recognition.start();
}

function createTodoItems(text) {
  todoList.innerHTML = '';

  const tasks = text
    .split(/\n|,|\band\b|\d+[.)-]?/i)
    .map((task) => task.trim())
    .filter(Boolean);

  if (!tasks.length) {
    setStatus('No tasks found. Try speaking or typing tasks separated by commas.');
    return;
  }

  for (const task of tasks) {
    const li = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    const label = document.createElement('span');
    label.textContent = task.charAt(0).toUpperCase() + task.slice(1);

    checkbox.addEventListener('change', () => {
      label.style.textDecoration = checkbox.checked ? 'line-through' : 'none';
      label.style.opacity = checkbox.checked ? '0.6' : '1';
    });

    li.append(checkbox, label);
    todoList.append(li);
  }

  setStatus(`Generated ${tasks.length} task${tasks.length > 1 ? 's' : ''}.`);
}

function setStatus(message) {
  statusText.textContent = message;
}
