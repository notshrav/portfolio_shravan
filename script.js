// SECTION SWITCH
function showSection(id) {
    document.querySelectorAll(".content").forEach(sec => {
        sec.style.display = "none";
    });

    document.getElementById(id).style.display = "block";

    document.querySelectorAll(".sidebar li").forEach(li => {
        li.classList.remove("active");
    });

    event.target.classList.add("active");
}

/* TYPING EFFECT */
const roles = [
    "Frontend Developer",
    "Builder",
    "Problem Solver",
    "Exploring Computer Science"
];

let i = 0, j = 0, current = "", isDeleting = false;

function typeEffect() {
    current = roles[i];

    if (isDeleting) j--;
    else j++;

    document.querySelector(".typing").textContent = current.substring(0, j);

    if (!isDeleting && j === current.length) {
        isDeleting = true;
        setTimeout(typeEffect, 1200);
        return;
    }

    if (isDeleting && j === 0) {
        isDeleting = false;
        i = (i + 1) % roles.length;
    }

    setTimeout(typeEffect, isDeleting ? 40 : 80);
}

typeEffect();

/* SLIDESHOW (AUTO + MANUAL) */
const images = [
    "assets/music1.png",
    "assets/music2.png",
    "assets/music3.png",
    "assets/music4.png",
    "assets/music5.png"
];

let currentIndex = 0;
let slideInterval;

/* Show slide */
function showSlide(index) {
    document.getElementById("slide").src = images[index];
}

/* Next */
function nextSlide() {
    currentIndex = (currentIndex + 1) % images.length;
    showSlide(currentIndex);
    resetAutoSlide();
}

/* Previous */
function prevSlide() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showSlide(currentIndex);
    resetAutoSlide();
}

/* AUTO SLIDE */
function startAutoSlide() {
    slideInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % images.length;
        showSlide(currentIndex);
    }, 3000); // change every 3 sec
}

/* RESET when user clicks */
function resetAutoSlide() {
    clearInterval(slideInterval);
    startAutoSlide();
}

/* START on load */
startAutoSlide();