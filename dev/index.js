// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"intro.js":[function(require,module,exports) {
var textWrappers = document.querySelectorAll(".letters");
textWrappers.forEach(function (node) {
  node.innerHTML = node.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
});
d3.select("#intro").style("transform", "translate(-50%,-50%)"); // d3.select("h1, h2")
// .style("transform", "scale(0) translate(-50%, -50%)")
// .transition()
// .duration(5000)
// .style("transform", "scale(1)")

d3.selectAll(".letter").style("opacity", 0).style("transform", function () {
  return "translate(".concat((Math.random() - 0.5) * 10, "px, ").concat((Math.random() - 0.5) * 10, "px) scale(0) rotate(45deg)");
}).transition().delay(function (_d, i) {
  return 400 * Math.sqrt(i);
}).duration(100).style("opacity", 1).style("transform", "translate(0px,0px) scale(1)").on("end", function (d, i, sel) {
  if (i + 1 == sel.length) {
    setTimeout(postText_step1, 500);
  }
});

function postText_step1() {
  d3.select("#intro").transition().duration(800).ease(d3.easeBackIn.overshoot(0.7)).styleTween("left", function () {
    return function (t) {
      return "".concat(50 * (1 - t), "%");
    };
  }).styleTween("transform", function () {
    return function (t) {
      return "translate(-".concat(50 * (1 - t), "%,-50%)");
    };
  }).on("end", postText_step2);
}

function postText_step2() {
  d3.select("#intro").style("top", "50%").transition().duration(1000).styleTween("transform", function () {
    return function (t) {
      return "translate(0%,-".concat(50 * (1 - t), "%)");
    };
  }).style("top", "0%").on("end", postText_step3);
}

function postText_step3() {
  d3.select("#intro").style("position", "static");
}
},{}],"index.js":[function(require,module,exports) {
"use strict";

require("./intro");
},{"./intro":"intro.js"}]},{},["index.js"], null)
//# sourceMappingURL=/index.js.map