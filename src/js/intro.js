let textWrappers = document.querySelectorAll(".letters");
textWrappers.forEach((node) => {
  node.innerHTML = node.textContent.replace(
    /\S/g,
    "<span class='letter'>$&</span>"
  );
});

d3.select("#intro").style("transform", "translate(-50%,-50%)");

// d3.select("h1, h2")
// .style("transform", "scale(0) translate(-50%, -50%)")
// .transition()
// .duration(5000)
// .style("transform", "scale(1)")

d3.selectAll(".letter")
  .style("opacity", 0)
  .style(
    "transform",
    () =>
      `translate(${(Math.random() - 0.5) * 10}px, ${
        (Math.random() - 0.5) * 10
      }px) scale(0) rotate(45deg)`
  )
  .transition()
  .delay((_d, i) => 400 * Math.sqrt(i))
  .duration(100)
  .style("opacity", 1)
  .style("transform", "translate(0px,0px) scale(1)")
  .on("end", (d, i, sel) => {
    if (i + 1 == sel.length) {
      setTimeout(postText_step1, 500);
    }
  });

function postText_step1() {
  d3.select("#intro")
    .transition()
    .duration(800)
    .ease(d3.easeBackIn.overshoot(0.7))
    .styleTween("left", function () {
      return (t) => `${50 * (1 - t)}%`;
    })
    .styleTween("transform", function () {
      return function (t) {
        return `translate(-${50 * (1 - t)}%,-50%)`;
      };
    })
    .on("end", postText_step2);
}

function postText_step2() {
  d3.select("#intro")
    .style("top", "50%")
    .transition()
    .duration(1000)
    .styleTween("transform", function () {
      return function (t) {
        return `translate(0%,-${50 * (1 - t)}%)`;
      };
    })
    .style("top", "0%")
    .on("end", postText_step3);
}

function postText_step3() {
  d3.select("#intro").style("position", "static");
}
