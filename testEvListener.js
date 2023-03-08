   // Get the element with the ID "box"
      const box = document.getElementById("box");

      // Add an event listener to the document to listen for the space bar key
      document.addEventListener("keydown", function(event) {
        // Check if the key pressed is the space bar
        if (event.code === "Space") {
          // Toggle the value of the animation-play-state property
          if (box.style.animationPlayState === "paused") {
            box.style.animationPlayState = "running";
          } else {
            box.style.animationPlayState = "paused";
          }
        }
      });