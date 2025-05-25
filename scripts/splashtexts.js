let isUpdating = false;
const splashTexts = [
  "Is fine-tuning your site's look too fiddly?",
  "Need to keep your rules in order?",
  "Is your code getting clouded?",
  "Is your code becoming a maze?",
  "Drowning in a sea of selectors?",
  "Does your code make you cringe?",
  "Is updating your site's style a chore?",
  "Is your site's style not stacking up?",
  "Feeling lost in the stylesheets?",
  "Is organizing your website's look a headache?",
  "Want your styles and HTML structure to correlate?"
];

const splashTextElem = document.getElementById("splashText");
splashTextElem.textContent = "";

updateSplashText("", splashTexts[Math.floor(Math.random() * splashTexts.length)]);

function attemptSplashTextUpdate() {
  if (!isUpdating) {
    let currentSplashText = splashTextElem.textContent;
    let newSplashText = splashTexts[Math.floor(Math.random() * splashTexts.length)];
    
    updateSplashText(currentSplashText, newSplashText); // Initiator of the recursion
  }
}

// Recursion
function updateSplashText(originalSplashText, newSplashText, currentSplashText = originalSplashText, i = 0, direction = -1) {
  
  let maxScramble = Math.min(8, splashTexts.reduce((a, b) => a.length <= b.length ? a : b).length);
  isUpdating = true
  
  function scrambleSplashText(splashText) {
    return splashText
      .split("")
      .map((ch) => {
        let newCharacter = 32;
        if (ch != " ") {
          let code = ch.charCodeAt(0);

          if (code >= 65 && code <= 90) newCharacter = 65;
          else newCharacter = 97;

          newCharacter += Math.floor(Math.random() * 26);
        }

        return String.fromCharCode(newCharacter);
      })
      .join("");
  };

  if (direction == -1 && i <= originalSplashText.length) {
    currentSplashText = currentSplashText.slice(0, -1);
    
    let scrambleCount = Math.min(i++, maxScramble);

    // Get the static part of the new splash text
    let staticPart = currentSplashText.slice(0, currentSplashText.length - scrambleCount);

    // Get the remaining part to be scrambled
    let remainingPart = currentSplashText.slice(currentSplashText.length - scrambleCount, originalSplashText.length);
    
    // Scramble the remaining part
    remainingPart = scrambleSplashText(remainingPart);

    // Combine the static part and the scrambled part
    currentSplashText = staticPart + remainingPart;

    splashTextElem.textContent = currentSplashText;

    if (staticPart.length == 0) direction = 1, i = 0;
  }
  else if (direction == 1) {
    // Get the static part of the new splash text
    let staticPart = newSplashText.slice(0, i);
    
    // Get the remaining part to be scrambled
    let remainingPart = newSplashText.slice(i, Math.min(i * 2, i + maxScramble));
    
    // Scramble the remaining part
    remainingPart = scrambleSplashText(remainingPart);

    // Combine the static part and the scrambled part
    currentSplashText = (staticPart + remainingPart).padEnd(maxScramble, currentSplashText);

    splashTextElem.textContent = currentSplashText;
    
    i++;
  };

  if (i <= originalSplashText.length || i <= newSplashText.length) {
    setTimeout(() => requestAnimationFrame(() => updateSplashText(originalSplashText, newSplashText, currentSplashText, i, direction)), 25); // Loop
  } else {
    setTimeout(() => isUpdating = false, 5000); // Exit
  }
}