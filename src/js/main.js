import "./firebase.min.js";
import {
  getDatabase,
  ref,
  set,
  child,
  get,
} from "https://www.gstatic.com/firebasejs/9.8.4/firebase-database.js";
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
let active = 1;

// file paths
const paths = {
  index: "index.html",
  register: "register.html",
  download: "download.html",
  result: "result.html",
};
const { index, register, download, result } = paths; // destructuring

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
  Webcam.set({
    width: 320,
    height: 240,
    image_format: "jpeg",
    jpeg_quality: 90,
    flip_horiz: true,
  });
  Webcam.attach("#camera");
};

// off webcam
const offWebcam = () => Webcam.reset();

// qr code scanner instance
const scanQr = () => {
  const video = document.querySelector("#qr-video");
  video.hidden = false;

  const qrScanner = new QrScanner(
    video,
    (result) => ProfileImage.readUser(result.data),
    {
      highlightScanRegion: true,
      highlightCodeOutline: true,
    }
  );

  return qrScanner;
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
        } else {
          const data = snapshot.val();
          Storage.setResult(data);
          window.location.href = result;
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

    return result;
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
    Webcam.on("live", () => {
      snapShot.addEventListener("click", () => {
        Webcam.freeze();
        snapShot.hidden = true;
        backBtnInformation.hidden = true;
        savePhoto.hidden = false;
        retakePhoto.hidden = false;
      });
    });
  }

  if (savePhoto) {
    savePhoto.addEventListener("click", () => {
      Webcam.snap((data_uri) => {
        const userInfo = new ProfileImage(
          Storage.getRegisteredUser().userID,
          Storage.getRegisteredUser().firstName,
          Storage.getRegisteredUser().lastName,
          Storage.getRegisteredUser().email,
          data_uri
        );
        Storage.setRegisteredUser(userInfo);
        document.querySelector("#avatar").src = data_uri;
        document.querySelector("#first-name").innerHTML =
          Storage.getRegisteredUser().firstName;
        document.querySelector("#last-name").innerHTML =
          Storage.getRegisteredUser().lastName;
        document.querySelector("#email-add").innerHTML =
          Storage.getRegisteredUser().email;
      });
      offWebcam();
      nextStep();
    });
  }

  if (retakePhoto) {
    retakePhoto.addEventListener("click", () => {
      Webcam.unfreeze();
      savePhoto.hidden = true;
      retakePhoto.hidden = true;
      snapShot.hidden = false;
      backBtnInformation.hidden = false;
    });
  }

  if (backBtnInformation) {
    backBtnInformation.addEventListener("click", () => {
      firstName.value = Storage.getRegisteredUser().firstName;
      lastName.value = Storage.getRegisteredUser().lastName;
      email.value = Storage.getRegisteredUser().email;
      prevStep();
      offWebcam();
    });
  }

  if (backBtnIdentity) {
    backBtnIdentity.addEventListener("click", () => {
      prevStep();
      openWebcam();
      savePhoto.hidden = true;
      retakePhoto.hidden = true;
      snapShot.hidden = false;
      backBtnInformation.hidden = false;
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
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
    closeScan.hidden = false;
    scanQr().start();
    idle();
  });
}

// close qr code scanner
if (closeScan)
  closeScan.addEventListener("click", () => window.location.reload());

// set and download qr code
if (window.location.pathname === `/${download}`) {
  Storage.checkRegisteredUser();
  generateQRCode();

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

// scanned result
if (window.location.pathname === `/${result}`) {
  if (Storage.getResult() === null) {
    document.querySelector('[data-result="failed"]').hidden = false;
  } else {
    document.querySelector('[data-result="success"]').hidden = false;
  }
}
