import '../styles/modern-normalize.css';
import '../styles/style.css';
import '../styles/components/header.css';
import '../styles/components/hero.css';
import '../styles/components/about.css';
import '../styles/components/contact.css';
import '../styles/components/projects.css';
import '../styles/components/media.css';
import '../styles/components/skills.css';
import '../styles/components/footer.css';
import '../styles/utils.css';

/*cards animation*/
const handleOnMouseMove = e => {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  };
  
  // Loop through all .card elements and attach the mousemove event listener
  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("mousemove", e => handleOnMouseMove(e));
  });