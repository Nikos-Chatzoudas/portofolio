import "../styles/modern-normalize.css";
import "../styles/style.css";
import "../styles/components/header.css";
import "../styles/components/hero.css";
import "../styles/components/about.css";
import "../styles/components/contact.css";
import "../styles/components/projects.css";
import "../styles/components/media.css";
import "../styles/components/skills.css";
import "../styles/components/footer.css";
import "../styles/utils.css";

//load animation
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let intervals = {};

// Function to handle the animation
function handleAnimation(entries, observer) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const element = entry.target;
      const originalText = element.innerText.trim();
      element.classList.add("show"); // Add 'show' class to mark as animated

      let iteration = 0;

      clearInterval(intervals[element.id]); // Clear previous interval

      intervals[element.id] = setInterval(() => {
        element.innerText = originalText
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return originalText[index];
            }
            return letters[Math.floor(Math.random() * 26)];
          })
          .join("");

        if (iteration >= originalText.length) {
          clearInterval(intervals[element.id]);
        }

        iteration += 1 / 3;
      }, 30);

      observer.unobserve(element); // Stop observing after animation
    }
  });
}

// Intersection Observer setup
const observer = new IntersectionObserver(handleAnimation, { threshold: 0.5 });

// Observe all elements with the class 'load'
const elements = document.querySelectorAll(".load");
elements.forEach((element) => {
  // Assign a unique ID to each observed element
  element.id = `element_${Math.random().toString(36).substr(2, 9)}`;
  observer.observe(element);
});

//skill bar
document.addEventListener("DOMContentLoaded", function () {
  let maxLines = 70; // Initial maximum number of lines

  const updateBars = (skillBar) => {
    const percentage = skillBar.getAttribute("per");
    const maxChars = maxLines;
    const filledBlocks = Math.round((percentage / 100) * maxChars);
    let currentFilled = 0;
    const fillInterval = setInterval(() => {
      if (currentFilled >= filledBlocks) {
        clearInterval(fillInterval);
        return;
      }
      const filled =
        "<span style='color: var(--clr-blue);'>" +
        "#".repeat(currentFilled) +
        "</span>";
      const empty = ".".repeat(maxChars - currentFilled);
      skillBar.innerHTML = `[${filled}${empty}]`;
      currentFilled++;
    }, 30);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const skillBar = entry.target;
        if (!skillBar.dataset.animated) {
          updateBars(skillBar);
          skillBar.dataset.animated = true;
        }
      }
    });
  });

  const updateMaxLines = () => {
    if (window.matchMedia("(max-width: 639px)").matches) {
      maxLines = 30; // Change the maxLines value within the specified range
    } else {
      maxLines = 70; // Reset the maxLines value for other screen sizes
    }
    const skillBars = document.querySelectorAll(".skill_per");
    skillBars.forEach((skillBar) => {
      observer.observe(skillBar);
    });
  };

  // Initial call to set maxLines based on viewport size
  updateMaxLines();

  // Listen for changes in viewport size and update maxLines
  window.addEventListener("resize", updateMaxLines);
});

import { Application } from '@splinetool/runtime';

const canvas = document.getElementById('canvas3d');
const app = new Application(canvas);
app.load('https://prod.spline.design/dwUZzcQa1GobHAQs/scene.splinecode');
