//Get HTML elements
const videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");
const device = document.getElementById("device");
const midiChannel = document.getElementById("midiChannel");
const sendMidi = document.getElementById("sendMidi");
const sound = document.getElementById("sound");
const column0 = document.getElementById("column0");
const column1 = document.getElementById("column1");
const column2 = document.getElementById("column2");
const column3 = document.getElementById("column3");
const Note0 = document.getElementById("Note0");
const Note1 = document.getElementById("Note1");
const Note2 = document.getElementById("Note2");
const Note3 = document.getElementById("Note3");
const sensitivity = document.getElementById("sensitivity");
const sensitivityValue = document.getElementById("sensitivityValue");
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

let chosenLandmarkIndex = 0;
let midiChannelCurrent = 1;

WebMidi.enable()
  .then(onEnabled)
  .catch((err) => alert(err));

function onEnabled() {
  for (let i = 0; i < WebMidi.outputs.length; i++) {
    jQuery("<option/>", {
      value: WebMidi.outputs[i].name,
      html: WebMidi.outputs[i].name,
    }).appendTo("#dropdown select");
  }
  output = WebMidi.outputs[0];
}

//choose Midi output
function changeDevice() {
  for (let i = 0; i < WebMidi.outputs.length; i++) {
    if (WebMidi.outputs[i].name === device.value) {
      output = WebMidi.outputs[i];
    }
  }
}

//Reset audio context
document.documentElement.addEventListener("mousedown", () => {
  if (Tone.context.state !== "running") Tone.context.resume();
});

//Tone.js nodes
//basic osc
const basic = new Tone.PolySynth().toDestination();
let synth = basic;

//casio sound
const casio = new Tone.Sampler({
  urls: {
    A2: "A1.mp3",
    A3: "A2.mp3",
  },
  baseUrl: "https://tonejs.github.io/audio/casio/",
}).toDestination();

const piano = new Tone.Sampler({
  urls: {
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
  },
  baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();

//pad sound
const pad = new Tone.Sampler({
  urls: {
    C3: "PadC3.wav",
    C4: "PadC4.wav",
    C5: "PadC5.wav",
  },
  baseUrl: "https://monlim.github.io/Soundfiles/Pad/",
}).toDestination();

//listen for changes to sound
sound.addEventListener("change", function () {
  if (sound.value === "basic") {
    synth = basic;
  }
  if (sound.value === "casio") {
    synth = casio;
  }
  if (sound.value === "piano") {
    synth = piano;
  }
  if (sound.value === "pad") {
    synth = pad;
  }
});

//listen for changes to Note0
Note0.addEventListener("change", function () {
  scaleArray[1] = noteDic[parseInt(Note0.value)];
  scaleArray[2] = noteDic[parseInt(Note0.value)];
});

Note1.addEventListener("change", function () {
  scaleArray[3] = noteDic[parseInt(Note1.value)];
  scaleArray[4] = noteDic[parseInt(Note1.value)];
});

Note2.addEventListener("change", function () {
  scaleArray[5] = noteDic[parseInt(Note2.value)];
  scaleArray[6] = noteDic[parseInt(Note2.value)];
});

Note3.addEventListener("change", function () {
  scaleArray[7] = noteDic[parseInt(Note3.value)];
  scaleArray[8] = noteDic[parseInt(Note3.value)];
});

midiChannel.addEventListener("change", function () {
  midiChannelCurrent = parseInt(midiChannel.value);
});

//listen for changes to bodypart tracked
bodypart.addEventListener("change", function () {
  if (bodypart.value === "nose") {
    chosenLandmarkIndex = 0;
  }
  if (bodypart.value === "rightWrist") {
    chosenLandmarkIndex = 15;
  }
  if (bodypart.value === "leftWrist") {
    chosenLandmarkIndex = 16;
  }
  if (bodypart.value === "leftAnkle") {
    chosenLandmarkIndex = 28;
  }
  if (bodypart.value === "rightAnkle") {
    chosenLandmarkIndex = 27;
  }
});

let noteDic = [
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B",
  ["C4", "E4", "G4"],
  ["C4", "D#4", "G4"],
  ["C#4", "F4", "G#4"],
  ["C#4", "E4", "G#4"],
  ["D4", "F#4", "A4"],
  ["D4", "F4", "A4"],
  ["D#4", "G4", "A#4"],
  ["D#4", "F#4", "A#4"],
  ["E4", "G#4", "B4"],
  ["E4", "G4", "B4"],
  ["F4", "A4", "C5"],
  ["F4", "G#4", "C5"],
  ["F#4", "A#4", "C#5"],
  ["F#4", "A4", "C#5"],
  ["G4", "B4", "D5"],
  ["G4", "A#4", "D5"],
  ["G#4", "C5", "D#5"],
  ["G#4", "B4", "D#5"],
  ["A4", "C#5", "E5"],
  ["A4", "C5", "E5"],
  ["A#4", "D5", "F5"],
  ["A#4", "C#5", "F5"],
  ["B4", "D#5", "F#5"],
  ["B4", "D5", "F#5"],
];

let scaleArray = [null, "C4", "C4", "D4", "D4", "E4", "E4", "G4", "G4", null];

/*function octaveUp() {
  scaleArray = scaleArray.map((pc) => Tonal.transpose(pc, "8P"));
}

function octaveDown() {
  scaleArray = scaleArray.map((pc) => Tonal.transpose(pc, "-8P"));
}*/

//adjust BPM
sensitivity.addEventListener("input", function (ev) {
  sensitivityValue.innerHTML = sensitivity.value;
  noteActivate = sensitivity.value;
});

//Trigger note if Landmark moves
let noteTrigger = false;
let speedLimit = false;
let noteDeactivate = 0.22;
let noteActivate = 5;

function triggerNote(chosenLandmark) {
  let noteIndex = Math.floor(chosenLandmark.x * 10);
  //console.log(noteIndex);
  let note = scaleArray[noteIndex];
  if (accel && note && accel >= noteActivate) {
    if (noteTrigger) return;
    if (speedLimit) return;
    noteTrigger = true;
    speedLimit = true;
    synth.triggerAttackRelease(note, 0.5);
    setTimeout(function () {
      speedLimit = false;
    }, 250);
    if (sendMidi.checked) {
      output.playNote(note, midiChannelCurrent);
    }
  }
  if (accel && accel < noteDeactivate) {
    noteTrigger = false;
  }
}

//function to calculate velocity
let xNow = 0.4,
  yNow = 0,
  still = 0,
  velNow = 0,
  accel = 0; // default values to start off distance calculation;

function velocityCounter(chosenLandmarkX, chosenLandmarkY) {
  xVelocity = (chosenLandmarkX - xNow) / 0.05;
  yVelocity = (chosenLandmarkY - yNow) / 0.05;
  still =
    Math.sqrt((chosenLandmarkX - xNow) ** 2 + (chosenLandmarkY - yNow) ** 2) /
    0.05;
  accel = Math.abs(still - velNow) / 0.05;
  xNow = chosenLandmarkX;
  yNow = chosenLandmarkY;
  velNow = still;
}

//draw pose Landmarks on screen;
function onResultsPose(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  if (results.poseLandmarks) {
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: "#FFFFFF",
      lineWidth: 4,
    });
    drawLandmarks(canvasCtx, results.poseLandmarks, {
      color: "#FF0000",
      lineWidth: 2,
    });
    chosenLandmark = results.poseLandmarks[chosenLandmarkIndex];
    setInterval(velocityCounter(chosenLandmark.x, chosenLandmark.y), 50);
    if (chosenLandmark && chosenLandmark.y <= 0.75) triggerNote(chosenLandmark);
    canvasCtx.restore();
  }
}

const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  },
});

pose.setOptions({
  selfieMode: true,
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

pose.onResults(onResultsPose);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({ image: videoElement });
  },
  width: "100%",
  height: "100%",
});
camera.start();
