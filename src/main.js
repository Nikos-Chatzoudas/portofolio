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

/*cards animation*/
const handleOnMouseMove = (e) => {
  const { currentTarget: target } = e;
  const rect = target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  target.style.setProperty("--mouse-x", `${x}px`);
  target.style.setProperty("--mouse-y", `${y}px`);
};

// Loop through all .card elements and attach the mousemove event listener
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("mousemove", (e) => handleOnMouseMove(e));
});

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
  const skillBars = document.querySelectorAll(".skill_per");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const skillBar = entry.target;
        const percentage = skillBar.getAttribute("per");
        const maxChars = 75;
        const filledBlocks = Math.round((percentage / 100) * maxChars);
        const filled =
          "<span style='color: var(--clr-blue);'>" +
          "#".repeat(filledBlocks) +
          "</span>";
        const empty = ".".repeat(maxChars - filledBlocks);

        skillBar.innerHTML = `[${filled}${empty}]`;
        observer.unobserve(skillBar); // Stop observing once loaded
      }
    });
  });

  skillBars.forEach((skillBar) => {
    observer.observe(skillBar);
  });
});
