import "intersection-observer";

function initObserver() {
  let active = null;
  const options = {
    root: document.querySelector("#content"),
    rootMargin: "-15% 0px 0px 0px",
    threshold: 0,
  };

  const intersectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      let relY = entry.boundingClientRect.y - entry.rootBounds.y;
      if (relY < 0) {
        if (active != entry.target) {
          console.log(entry);
          activateTarget(entry.target, active);
          active = entry.target;
        }
      }
    });
  }, options);

  const steps = [...document.querySelectorAll(".project-container")];
  steps.forEach((step) => intersectionObserver.observe(step));
}

function activateTarget(el, prevEl) {
  let offset;
  const textOffsetPre = prevEl
    ? d3.select(prevEl).select(".project-description").node().offsetHeight
    : 0;
  const scrollPos = el.parentElement.scrollTop;
  clearText();
  const paraNode = d3.select(el).select(".project-description");
  const data = el.dataset;
  paraNode.text(data.description).transition().style("opacity", 1);

  if (prevEl) {
    if (el.dataset.index > prevEl.dataset.index) {
      offset = scrollPos - textOffsetPre - 10;
    } else {
      offset = scrollPos;
    }
  }

  el.parentElement.scrollTop = offset;
}

function clearText() {
  d3.selectAll(".project-description").style("opacity", 0).html(null);
}

export { initObserver };
