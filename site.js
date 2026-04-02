(() => {
  const stage = document.querySelector("[data-schematic-stage]");
  const shape = stage?.querySelector("[data-schematic-shape]");
  const burst = stage?.querySelector("[data-schematic-burst]");

  if (!stage || !shape || !burst) {
    return;
  }

  const BUILD_DURATION = 3200;
  const RESTART_DELAY = 180;

  let hovering = false;
  let formed = false;
  let exploding = false;
  let charge = 0;
  let rpm = 0;
  let rotation = 0;
  let lastTime = 0;
  let buildTimer = 0;
  let restartTimer = 0;

  const setShapeState = (angle, scale) => {
    shape.style.setProperty("--shape-rotation", angle.toFixed(3) + "deg");
    shape.style.setProperty("--shape-scale", scale.toFixed(3));
  };

  const clearTimers = () => {
    window.clearTimeout(buildTimer);
    window.clearTimeout(restartTimer);
    buildTimer = 0;
    restartTimer = 0;
  };

  const triggerBurst = () => {
    burst.classList.remove("is-active");
    void burst.offsetWidth;
    burst.classList.add("is-active");
  };

  const startCycle = () => {
    clearTimers();
    formed = false;
    exploding = false;
    charge = 0;
    rpm = 0;
    rotation = 0;

    stage.classList.remove("is-assembling", "is-built", "is-formed", "is-hovering");
    shape.classList.remove("is-exploding");
    burst.classList.remove("is-active");
    shape.style.removeProperty("--explosion-rotation");
    shape.style.opacity = "1";
    shape.style.filter = "drop-shadow(0 0 18px rgba(247, 243, 255, 0.12))";
    setShapeState(0, 0.95);

    void stage.offsetWidth;
    stage.classList.add("is-assembling");

    buildTimer = window.setTimeout(() => {
      stage.classList.remove("is-assembling");
      stage.classList.add("is-built", "is-formed");
      if (hovering) {
        stage.classList.add("is-hovering");
      }
      formed = true;
      charge = hovering ? 0.08 : 0;
      setShapeState(rotation, 1);
    }, BUILD_DURATION);
  };

  const explode = () => {
    if (!formed || exploding) {
      return;
    }

    exploding = true;
    formed = false;

    const frozenRotation = ((rotation % 360) + 360) % 360;
    shape.style.setProperty("--explosion-rotation", frozenRotation.toFixed(3) + "deg");
    shape.style.setProperty("--shape-rotation", frozenRotation.toFixed(3) + "deg");
    shape.style.setProperty("--shape-scale", (1 + Math.min(charge * 0.05, 0.08)).toFixed(3));

    stage.classList.remove("is-formed", "is-hovering");
    triggerBurst();
    shape.classList.add("is-exploding");
  };

  stage.addEventListener("pointerenter", () => {
    hovering = true;

    if (formed && !exploding) {
      stage.classList.add("is-hovering");
    }
  });

  stage.addEventListener("pointerleave", () => {
    hovering = false;
    stage.classList.remove("is-hovering");
  });

  shape.addEventListener("animationend", (event) => {
    if (event.target !== shape || event.animationName !== "explodeCrystal") {
      return;
    }

    restartTimer = window.setTimeout(startCycle, RESTART_DELAY);
  });

  const tick = (now) => {
    if (!lastTime) {
      lastTime = now;
    }

    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (!exploding) {
      if (formed) {
        if (hovering) {
          charge = Math.min(charge + delta * 1.5, 1.05);
        } else {
          charge = Math.max(charge - delta * 1.9, 0);
        }

        const targetRpm = hovering ? 18 + Math.pow(charge, 2.25) * 940 : 2.4;
        rpm += (targetRpm - rpm) * Math.min(1, delta * 5.1);
        rotation += rpm * 6 * delta;

        const scale = 1 + Math.min(charge * 0.05, 0.07);
        const shadowBlur = 16 + charge * 30;
        const shadowAlpha = 0.12 + charge * 0.22;

        setShapeState(rotation, scale);
        shape.style.opacity = "1";
        shape.style.filter = "drop-shadow(0 0 " + shadowBlur.toFixed(1) + "px rgba(247, 243, 255, " + shadowAlpha.toFixed(3) + "))";

        if (hovering && charge >= 1) {
          explode();
        }
      } else if (stage.classList.contains("is-assembling")) {
        rotation = Math.sin(now / 520) * 1.6;
        setShapeState(rotation, 0.97);
        shape.style.opacity = "1";
        shape.style.filter = "drop-shadow(0 0 18px rgba(247, 243, 255, 0.12))";
      }
    }

    window.requestAnimationFrame(tick);
  };

  startCycle();
  window.requestAnimationFrame(tick);
})();

(() => {
  const heroForm = document.querySelector(".hero-form");
  const emailInput = heroForm?.querySelector('input[type="email"]');

  if (!heroForm) {
    return;
  }

  const recipient = "snejati2@unl.edu";

  heroForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const senderEmail = emailInput?.value.trim() ?? "";
    const bodyLines = [
      "Hello,",
      "",
      "I am reaching out from the Nejati Lab website.",
    ];

    if (senderEmail) {
      bodyLines.push("", "My email: " + senderEmail);
    }

    bodyLines.push("", "Best,");

    const mailtoUrl =
      "mailto:" +
      recipient +
      "?subject=" +
      encodeURIComponent("Nejati Lab Inquiry") +
      "&body=" +
      encodeURIComponent(bodyLines.join("\n"));

    window.location.href = mailtoUrl;
  });
})();
