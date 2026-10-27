"use strict";
/* Data sets shared by the correlation and regression pages. */
const CERAMIC = [   // Barbetta Ex. 11.1: linear shrinkage (%), mechanical strength (MPa), water absorption (%)
  [8.70, 38.42, 5.54], [11.68, 46.93, 2.83], [8.30, 38.05, 5.58], [12.00, 47.04, 1.10], [9.50, 50.90, 0.64], [8.58, 34.10, 7.25],
  [10.68, 48.23, 1.88], [6.32, 27.74, 9.92], [8.20, 39.20, 5.63], [13.24, 60.24, 0.58], [9.10, 40.58, 3.64], [8.33, 41.07, 5.87],
  [11.34, 41.94, 3.32], [7.48, 35.53, 6.00], [12.68, 38.42, 0.36], [8.76, 45.26, 4.14], [9.93, 40.70, 5.48], [6.50, 29.66, 8.98]];
const ceramicPairs = (i, j, n = CERAMIC.length) => CERAMIC.slice(0, n).map(r => [r[i], r[j]]);
const ENTRANCE = [  // Barbetta Exercise 11.3: entrance exam in mathematics (X), final grade in calculus (Y)
  [39, 65], [43, 78], [21, 52], [64, 82], [65, 88], [57, 92], [47, 89], [28, 73], [75, 98], [47, 71],
  [34, 56], [52, 75], [35, 50], [30, 50], [28, 52], [40, 70], [70, 50], [80, 90], [32, 58], [67, 88]];
const OCTANE = [[1, 80.5], [2, 81.6], [3, 82.1], [4, 83.7], [5, 83.9], [6, 85.0]];   // Barbetta Ex. 11.2
