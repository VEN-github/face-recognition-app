import "./firebase.min.js";
import {
  getDatabase,
  ref,
  set,
  child,
  get,
} from "https://www.gstatic.com/firebasejs/9.8.4/firebase-database.js";
import Webcam from "./webcam-easy.min.js";
import QrScanner from "./qr-scanner.min.js";

const form = document.querySelector("#registerForm");
const stepProgress = document.querySelectorAll(".step");
const formStep = document.querySelectorAll(".form-step");
const snapShot = document.querySelector("#take-snapshot");
const savePhoto = document.querySelector("#save-photo");
const retakePhoto = document.querySelector("#retake-photo");
const backBtnInformation = document.querySelector("#back-information");
const backBtnIdentity = document.querySelector("#back-identity");
const submitBtn = document.querySelector("#submit-btn");
const openScan = document.querySelector("#open-scanner");
const closeScan = document.querySelector("#close-scanner");
const closeResult = document.querySelectorAll(".close-result");
const fileSelector = document.querySelector("#upload-qr");
const webcamElement = document.querySelector("#webcam");
const canvasElement = document.querySelector("#canvas");
let webcam;
if (webcamElement && canvasElement)
  webcam = new Webcam(webcamElement, "user", canvasElement);
let active = 1;

// file paths
const paths = {
  index: "index.html",
  register: "register.html",
  download: "download.html",
  recognition: "recognition.html",
  result: "result.html",
};
const { index, register, download, recognition, result } = paths; // destructuring

// idle timer
const idle = () => {
  let idleTime = 0;
  let timer = setInterval(() => {
    idleTime += 1;
    if (idleTime === 120) clearInterval(timer), window.location.reload();
  }, 1000);

  // Zero the idle timer on mouse movement and keyboard movement.
  document.addEventListener("mousemove", () => (idleTime = 0));
  document.addEventListener("keydown", () => (idleTime = 0));
};

// generate unique ID
const generateID = () => {
  const date = new Date();
  const uniqueID = `${date.getFullYear()}-${Math.random()
    .toString(36)
    .slice(-5)}`;

  return uniqueID;
};

// generate QR Code
const generateQRCode = () => {
  new QRCode(
    document.querySelector("#qrcode"),
    Storage.getRegisteredUser().userID
  );
  document.querySelector(
    "#qr-name"
  ).innerHTML = `${Storage.getRegisteredUser().firstName.toUpperCase()} ${Storage.getRegisteredUser().lastName.toUpperCase()}`;
};

// display error message
const displayErrMsg = (feedback, input) => {
  const div = document.createElement("div");
  div.classList.add("invalid-feedback");
  div.innerHTML = feedback;
  input.classList.add("invalid");
  input.focus();
  input.nextElementSibling.after(div);
};

// reset error message
const resetErrMsg = () => {
  document.querySelectorAll(".invalid-feedback").forEach((div) => div.remove());
  document
    .querySelectorAll(".form-control")
    .forEach((el) => el.classList.remove("invalid"));
};

// next form
const nextStep = () => {
  active++;
  if (active > stepProgress.length) active = stepProgress.length;
  updateProgress();
};

// previous form
const prevStep = () => {
  active--;
  if (active < 1) active = 1;
  updateProgress();
};

// current form
const updateProgress = () => {
  stepProgress.forEach((step, i) => {
    if (i === active - 1) {
      step.classList.add("active");
      formStep[i].hidden = false;
      formStep[i].classList.add("active");
    } else {
      step.classList.remove("active");
      formStep[i].classList.remove("active");
      formStep[i].hidden = true;
    }
  });
};

// open webcam
const openWebcam = () => {
  webcam
    .start()
    .then((result) => {
      console.log(result, "webcam started");
      webcamElement.hidden = false;
      if (snapShot) snapShot.hidden = false;
    })
    .catch((err) => {
      console.error(err);
      Toastify({
        text: "Permission denied. Allow me to use your camera.",
        duration: 3000,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        backgroundColor: "#d33329",
      }).showToast();
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    });
};

// off webcam
const offWebcam = () => {
  webcam.stop();
  webcamElement.hidden = true;
  canvasElement.hidden = true;
  snapShot.hidden = true;
};

// qr code scanner instance
const scanQr = () => {
  const video = document.querySelector("#qr-video");
  video.hidden = false;

  const qrScanner = new QrScanner(
    video,
    (result) => {
      document.querySelector(".loading-screen").hidden = false;
      qrScanner.destroy();
      video.hidden = true;
      ProfileImage.readUser(result.data);
    },
    {
      highlightScanRegion: true,
      highlightCodeOutline: true,
    }
  );

  return qrScanner;
};

// face api models
const models = () => {
  Promise.all([
    faceapi.nets.faceLandmark68Net.loadFromUri("models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("models"),
    faceapi.nets.ssdMobilenetv1.loadFromUri("models"),
  ]).then(start);
};

// start face recognition
const start = async () => {
  const labeledFaceDescriptors = await loadImage();
  if (labeledFaceDescriptors) {
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);
    document.querySelector(".loading-screen").hidden = true;
    openWebcam();

    let ctr = 5;
    setInterval(async () => {
      ctr--;
      if (ctr >= 1) document.querySelector("#count").innerHTML = ctr;
      if (ctr === 0) {
        document
          .querySelector(".overlay-timer")
          .style.setProperty("--bg-color", "transparent");
        document.querySelector("#count").hidden = true;
        webcam.snap();

        const detection = await faceapi
          .detectSingleFace(canvasElement)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const displaySize = {
            width: canvasElement.width,
            height: canvasElement.height,
          };
          const resizedDetection = faceapi.resizeResults(
            detection,
            displaySize
          );
          const results = faceMatcher.findBestMatch(
            resizedDetection.descriptor
          );
          const output = {
            result: results.label,
            image: Storage.getResult().image,
          };

          Storage.setResult(output);
          window.location.href = result;
        } else {
          webcam.stop();
          Toastify({
            text: "No faces detected. Please try again.",
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            backgroundColor: "#d33329",
          }).showToast();
          setTimeout(() => {
            Storage.removeResult();
            window.location.href = index;
          }, 3000);
        }
      }
    }, 1000);
  }
};

// load all images for face recognition
const loadImage = async () => {
  const img = await faceapi.fetchImage(Storage.getResult().image);
  const detections = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detections) {
    Toastify({
      text: `There were no faces in the picture based on the QR code. 
      You must use the QR code provided.`,
      duration: 3000,
      close: true,
      gravity: "top", // `top` or `bottom`
      position: "center", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      backgroundColor: "#d33329",
    }).showToast();
    setTimeout(() => {
      Storage.removeResult();
      window.location.href = index;
    }, 3000);
  } else {
    const descriptions = [detections.descriptor];
    return new faceapi.LabeledFaceDescriptors(
      `${Storage.getResult().firstName} ${Storage.getResult().lastName}`,
      descriptions
    );
  }
};

// user information
class User {
  constructor(userID, firstName, lastName, email) {
    this.userID = userID;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
  }
}

// user information with image
class ProfileImage extends User {
  constructor(userID, firstName, lastName, email, image) {
    super(userID, firstName, lastName, email);
    this.image = image;
  }

  // add user to db
  addUser() {
    const db = getDatabase();
    const reference = ref(db, `users/${this.userID}`);
    set(reference, {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      image: this.image,
    })
      .then(() => (window.location.href = download))
      .catch((err) => console.error(err));
  }

  // read user from db
  static readUser(userID) {
    const db = getDatabase();
    const userRef = ref(db);
    get(child(userRef, `users/${userID}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          Storage.setResult(data);
          window.location.href = recognition;
        } else {
          document.querySelector(".loading-screen").hidden = true;
          Toastify({
            text: "No Match Found.",
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            backgroundColor: "#d33329",
          }).showToast();
          document.querySelector("#illustration").hidden = false;
          openScan.hidden = false;
          document.querySelector("#upload-qr-btn").style.display = "block";
          closeScan.hidden = true;
        }
      })
      .catch((err) => console.error(err));
  }
}

// local storage
class Storage {
  // set registered user in local storage
  static setRegisteredUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  // get registered user in local storage
  static getRegisteredUser() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user !== null) return user;
  }

  // check local storage if there is registered user
  static checkRegisteredUser() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user === null) window.location.href = register;
  }

  // set the scanned result in local storage
  static setResult(data) {
    localStorage.setItem("result", JSON.stringify(data));
  }

  // get the scanned result in local storage
  static getResult() {
    const result = JSON.parse(localStorage.getItem("result"));

    if (result !== null) return result;
  }

  // check local storage if there is scanned result
  static checkResult() {
    const result = JSON.parse(localStorage.getItem("result"));

    if (result === null) window.location.href = index;
  }

  // remove the scanned result in local storage
  static removeResult() {
    localStorage.removeItem("result");
  }
}

// register process
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const firstName = document.querySelector("#firstName");
    const lastName = document.querySelector("#lastName");
    const email = document.querySelector("#email");
    let feedback;

    if (firstName.value === "" || firstName.value.length === 0) {
      resetErrMsg();
      feedback = "Please enter your first name.";
      displayErrMsg(feedback, firstName);
    } else if (lastName.value === "" || lastName.value.length === 0) {
      resetErrMsg();
      feedback = "Please enter your last name.";
      displayErrMsg(feedback, lastName);
    } else if (email.value === "" || email.value.length === 0) {
      resetErrMsg();
      feedback = "Please enter your email address.";
      displayErrMsg(feedback, email);
    } else {
      resetErrMsg();
      const user = new User(
        generateID(),
        firstName.value,
        lastName.value,
        email.value
      );
      Storage.setRegisteredUser(user);
      form.reset();
      nextStep();
      openWebcam();
    }
  });

  if (snapShot) {
    snapShot.addEventListener("click", () => {
      let picture = webcam.snap();
      webcamElement.hidden = true;
      snapShot.hidden = true;
      backBtnInformation.hidden = true;
      canvasElement.hidden = false;
      savePhoto.hidden = false;
      retakePhoto.hidden = false;
      const userInfo = new ProfileImage(
        Storage.getRegisteredUser().userID,
        Storage.getRegisteredUser().firstName,
        Storage.getRegisteredUser().lastName,
        Storage.getRegisteredUser().email,
        picture
      );
      Storage.setRegisteredUser(userInfo);
    });
  }

  if (savePhoto) {
    savePhoto.addEventListener("click", () => {
      document.querySelector("#avatar").src = Storage.getRegisteredUser().image;
      document.querySelector("#first-name").innerHTML =
        Storage.getRegisteredUser().firstName;
      document.querySelector("#last-name").innerHTML =
        Storage.getRegisteredUser().lastName;
      document.querySelector("#email-add").innerHTML =
        Storage.getRegisteredUser().email;
      offWebcam();
      nextStep();
    });
  }

  if (retakePhoto) {
    retakePhoto.addEventListener("click", () => {
      canvasElement.hidden = true;
      savePhoto.hidden = true;
      retakePhoto.hidden = true;
      webcamElement.hidden = false;
      snapShot.hidden = false;
      backBtnInformation.hidden = false;
    });
  }

  if (backBtnInformation) {
    backBtnInformation.addEventListener("click", () => {
      offWebcam();
      firstName.value = Storage.getRegisteredUser().firstName;
      lastName.value = Storage.getRegisteredUser().lastName;
      email.value = Storage.getRegisteredUser().email;
      prevStep();
    });
  }

  if (backBtnIdentity) {
    backBtnIdentity.addEventListener("click", () => {
      prevStep();
      openWebcam();
      savePhoto.hidden = true;
      retakePhoto.hidden = true;
      backBtnInformation.hidden = false;
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      document.querySelector(".loading-screen").hidden = false;
      const userInfo = new ProfileImage(
        Storage.getRegisteredUser().userID,
        Storage.getRegisteredUser().firstName,
        Storage.getRegisteredUser().lastName,
        Storage.getRegisteredUser().email,
        Storage.getRegisteredUser().image
      );
      userInfo.addUser();
    });
  }
}

// open qr code scanner
if (openScan) {
  openScan.addEventListener("click", () => {
    document.querySelector("#illustration").hidden = true;
    openScan.hidden = true;
    document.querySelector("#upload-qr-btn").style.display = "none";
    closeScan.hidden = false;
    scanQr().start();
    idle();
  });
}

// scan uploaded qr code
if (fileSelector) {
  fileSelector.addEventListener("change", () => {
    const file = fileSelector.files[0];
    if (!file) {
      return;
    }
    QrScanner.scanImage(file, { returnDetailedScanResult: true })
      .then((result) => ProfileImage.readUser(result.data))
      .catch((e) => {
        Toastify({
          text: `${e}. Please try again.`,
          duration: 3000,
          close: true,
          gravity: "top", // `top` or `bottom`
          position: "center", // `left`, `center` or `right`
          stopOnFocus: true, // Prevents dismissing of toast on hover
          backgroundColor: "#d33329",
        }).showToast();
      });
  });
}

// close qr code scanner
if (closeScan)
  closeScan.addEventListener("click", () => window.location.reload());

// close face scan
if (closeResult) {
  closeResult.forEach((close) => {
    close.addEventListener("click", () => {
      Storage.removeResult();
      window.location.href = index;
    });
  });
}

// set and download qr code
if (window.location.pathname === `/${download}`) {
  Storage.checkRegisteredUser();
  generateQRCode();
  setTimeout(() => {
    document.querySelector(".loading-screen").hidden = true;
  }, 2000);

  const downloadQR = document.querySelector("#download-qr");

  downloadQR.addEventListener("click", () => {
    html2canvas(document.querySelector("#qr-code-wrapper")).then((canvas) => {
      const uri = canvas.toDataURL();
      const filename = `${Storage.getRegisteredUser().firstName} ${
        Storage.getRegisteredUser().lastName
      }.jpg`;

      const link = document.createElement("a");
      if (typeof link.download === "string") {
        link.href = uri;
        link.download = filename;
        document.body.appendChild(link); //Firefox requires the link to be in the body
        link.click(); //simulate click
        document.body.removeChild(link); //remove the link when done
      } else {
        window.open(uri);
      }
      localStorage.removeItem("user");
      window.location.href = index;
    });
  });
}

// location of  face scanner
if (window.location.pathname === `/${recognition}`) {
  Storage.checkResult();
  models();
}

// result of face scanner
if (window.location.pathname === `/${result}`) {
  Storage.checkResult();
  if (Storage.getResult().result === "unknown") {
    document.querySelector('[data-result="failed"]').hidden = false;
  } else {
    document.querySelector("#output-img").src = Storage.getResult().image;
    document.querySelector("#output-name").innerHTML =
      Storage.getResult().result;
    document.querySelector('[data-result="success"]').hidden = false;
  }
}
