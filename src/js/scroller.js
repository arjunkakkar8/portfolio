import * as THREE from "three";
import "intersection-observer";
import { uniforms } from "./background";

function initObserver() {
  let active = null;
  const options = {
    root: document.querySelector("#content"),
    rootMargin: '-10%',
    threshold: new Array(10).fill(1).map((_, i) => 0.1 * i),
  };

  const intersectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        let relY = entry.boundingClientRect.y - entry.rootBounds.y;
        console.log(relY)
        if (relY < 100) {
          if (active != entry.target) {
            const curr_tex = active
              ? d3.select(active).node().dataset.img
              : null;
            const next_tex = d3.select(entry.target).node().dataset.img;
            if (active) {
              uniforms.tex_curr.value = new THREE.TextureLoader().load(
                curr_tex,
                function (tex) {
                  uniforms.tex_curr_ratio.value =
                    tex.image.width / tex.image.height;
                }
              );
            }
            uniforms.tex_next.value = new THREE.TextureLoader().load(
              next_tex,
              function (tex) {
                uniforms.tex_next_ratio.value =
                  tex.image.width / tex.image.height;
              }
            );
            uniforms.transitionProgress.value = 0;
            activateTarget(entry.target, active);
            active = entry.target;
          }
        }
      }
    });
  }, options);

  const steps = [...document.querySelectorAll(".project-container")];
  steps.forEach((step) => intersectionObserver.observe(step));
}

function activateTarget(el, prevEl) {
  d3.select(prevEl).classed("active", false);
  d3.select(el).classed("active", true);
}

export { initObserver };
