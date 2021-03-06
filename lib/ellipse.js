'use strict';

/* eslint-disable space-infix-ops */

// To convert degree in radians
//
var torad = Math.PI / 180;

// Class constructor :
//  an ellipse centred at 0 with radii rx,ry and x - axis - angle ax.
// The precision is used by methods .isDegenerate() .transform() and .normalize()
//
function Ellipse(rx, ry, ax, precision) {
  if (!(this instanceof Ellipse)) { return new Ellipse(rx, ry, ax, precision); }
  this.rx = rx;
  this.ry = ry;
  this.ax = ax;

  // The precision used to consider an ellipse as a circle or as degenerate
  this.epsilon = (typeof precision === 'undefined') ? 1e-7 : +('1e'+(-precision));
}

// Apply a linear transform m to the ellipse
// m is an array representing a matrix :
//    -         -
//   | m[0] m[2] |
//   | m[1] m[3] |
//    -         -
// return an ellipse with normalised angle :
//  - if circle the angle is 0
//  - in any case the angle is in [0,90]
//
Ellipse.prototype.transform = function (m) {
  // We consider the current ellipse as image of the unit circle
  // by first scale(rx,ry) and then rotate(ax) ...
  // So we apply ma =  m x rotate(ax) x scale(rx,ry) to the unit circle.
  var c = Math.cos(this.ax * torad), s = Math.sin(this.ax * torad);
  var ma = [ this.rx * (m[0]*c + m[2]*s),
             this.rx * (m[1]*c + m[3]*s),
             this.ry * (-m[0]*s + m[2]*c),
             this.ry * (-m[1]*s + m[3]*c) ];

  // ma * transpose(ma) = [ J L ]
  //                      [ L K ]
  // L is calculated later (if the image is not a circle)
  var J = ma[0]*ma[0] + ma[2]*ma[2],
      K = ma[1]*ma[1] + ma[3]*ma[3];

  // the sqrt of the discriminant of the characteristic polynomial of ma * transpose(ma)
  // this is also the geometric mean of the eigenvalues
  var D = Math.sqrt(((ma[0]-ma[3])*(ma[0]-ma[3]) + (ma[2]+ma[1])*(ma[2]+ma[1])) *
                    ((ma[0]+ma[3])*(ma[0]+ma[3]) + (ma[2]-ma[1])*(ma[2]-ma[1])));

  // the arithmetic mean of the eigenvalues
  var JK = (J + K) / 2;

  // check if the image is (almost) a circle
  if (D <= this.epsilon) {
    this.rx = this.ry = Math.sqrt(JK);
    this.ax = 0;
    return this;
  }

  // check if ma * transpose(ma) is (almost) diagonal
  if ( Math.abs(D - Math.abs(J - K)) <= this.epsilon) {
    this.rx = Math.sqrt(J);
    this.ry = Math.sqrt(K);
    this.ax = 0;
    return this;
  }

  // if it is not a circle, nor diagonal
  var L = ma[0]*ma[1] + ma[2]*ma[3];

  // {l1,l2} = the two eigen values of ma * transpose(ma)
  var l1 = JK + D/2,
      l2 = JK - D/2;

  // the x - axis - rotation angle is the argument of the l1 - eigenvector
  if (Math.abs(L) <= this.epsilon && Math.abs(l1-K) <= this.epsilon) { // if (ax == 90) => ax = 0 and exchange axes
    this.ax = 0;
    this.rx = Math.sqrt(l2);
    this.ry = Math.sqrt(l1);
    return this;
  }

  this.ax = Math.atan(Math.abs(L) > Math.abs(l1 - K) ?
                      (l1 - J) / L
                    :
                      L / (l1 - K)
                    ) / torad; // the angle in degree

  // if ax > 0 => rx = sqrt(l1), ry = sqrt(l2), else exchange axes and ax += 90
  if (this.ax >= 0) {
    // if ax in [0,90]
    this.rx = Math.sqrt(l1);
    this.ry = Math.sqrt(l2);
  } else {
    // if ax in ]-90,0[ => exchange axes
    this.ax += 90;
    this.rx = Math.sqrt(l2);
    this.ry = Math.sqrt(l1);
  }

  return this;
};

// Check if the ellipse is (almost) degenerate, i.e. rx = 0 or ry = 0
//
Ellipse.prototype.isDegenerate = function () {
  return (Math.abs(this.rx) <= this.epsilon || Math.abs(this.ry) <= this.epsilon);
};

// Normalise ellipse
//  - (dx,dy) must be non zero vector, the ellipse is scaled to put this vector inside it
//  - the angle is normalised to be in [0,90[
//
Ellipse.prototype.normalise = function (dx, dy) {
  // radii to >=0
  this.rx = Math.abs(this.rx);
  this.ry = Math.abs(this.ry);
  // if almost a circle
  if (Math.abs(this.rx-this.ry) <= this.epsilon) {
    // make it a circle
    this.ax = 0;
    this.rx = this.ry = (this.rx+this.ry)/2;
  } else {
    // normalise the angle
    this.ax = this.ax % 180; // set the angle in ]-180,180[
    if (this.ax < 0) { this.ax += 180; } // set the angle in [0,180[
    if (this.ax >= 90) {
      var tempr;
      // set the angle in [ 0,90 [ by exchanging axes
      tempr = this.rx;
      this.rx = this.ry;
      this.ry = tempr;
      this.ax = this.ax - 90;
    }
  }

  if (!dx && !dy) { return this; }

  // scale radii if needed
  var c = Math.cos(this.ax * torad), s = Math.sin(-this.ax * torad),
      ndx = (dx * c - dy * s) / this.rx,
      ndy = (dx * s + dy * c) / this.ry,
      k = Math.sqrt(ndx * ndx + ndy * ndy);
  if (k > 1) {
    this.rx *= k;
    this.ry *= k;
  }

  return this;
};


module.exports = Ellipse;
