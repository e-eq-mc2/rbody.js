/**
 * @author nk-nishizawa
 */

"use strict";

function RbodySystem() {
	var nx = 8, ny =16, nz = 8;
	var dt        = 1 / 100;
	var radius    =  1 / 10;
	var mass      =    1.00;
	var Kspring   = 3000.00;
	var Kdamping  =   10.00;
	var Kfriction =    5.00;
	var ga        = [0, -9.8, 0];
	var x0        = [ -1, -2, -1];
	var x1        = [  1,  2,  1];
	
	this.initialize(
		nx, ny, nz,
		dt, 
		radius, 
		mass,
		Kspring, Kdamping, Kfriction,
		ga,
		x0, x1
	);
}

RbodySystem.prototype.initialize = function (
	nx, ny, nz,
	dt,
	radius, 
	mass,
	Kspring, Kdamping, Kfriction,
	ga,
	x0, x1
) {
	this.dt        = dt;
	this.radius    = radius;
	this.mass      = mass;
	this.Kspring   = Kspring;
	this.Kdamping  = Kdamping;
	this.Kfriction = Kfriction;
	this.gf        = V3.scale(ga, mass);
	
	this.body = new Array(nx * ny * nz);
	for (var i=0; i < this.body.length; ++i) {
		this.body[i] = new Particle();
	}
	initParticle(this.body, nx, ny, nz, radius, x0, x1);

	this.bound = new Array(6);
	for (var i=0; i < this.bound.length; ++i) {
		this.bound[i] = new Face();
	}
	initFace(this.bound, x0, x1);

	//////////////
	// Particle //
	//////////////
	function Particle() {
		this.x = V3.O();
		this.v = V3.O();
		this.P = V3.O();
	}
	Particle.prototype.toGLM4x4 = function (dst) {
		var m00 = 1; var m01 = 0; var m02 = 0; var m03 = this.x[0];
		var m10 = 0; var m11 = 1; var m12 = 0; var m13 = this.x[1];
		var m20 = 0; var m21 = 0; var m22 = 1; var m23 = this.x[2];
		var m30 = 0; var m31 = 0; var m32 = 0; var m33 =         1;
		if ( ! dst ) dst = [];
		// column 0
		dst[ 0] = m00;
		dst[ 1] = m10;
		dst[ 2] = m20;
		dst[ 3] = m30;
		// column 1
		dst[ 4] = m01;
		dst[ 5] = m11;
		dst[ 6] = m21;
		dst[ 7] = m31;
		// column 2
		dst[ 8] = m02;
		dst[ 9] = m12;
		dst[10] = m22;
		dst[11] = m32;
		// column 3
		dst[12] = m03;
		dst[13] = m13;
		dst[14] = m23;
		dst[15] = m33;
		return dst;
	};
	function initParticle(particle, nx, ny, nz, r, x0, x1) {
		var vary = 0.05;
		var diameter = r + r;
		var distance = diameter * (1 + vary);
		var cx = x0[0] + (x1[0] - x0[0]) * 0.5;
		var cy = x0[1] + (x1[1] - x0[1]) * 0.5;
		var cz = x0[2] + (x1[2] - x0[2]) * 0.5;
		var ox = cx - distance * (nx - 1) * 0.5;
		var oy = cy - distance * (ny - 1) * 0.5;
		var oz = cz - distance * (nz - 1) * 0.5;
		var ii = 0;
		for (var k=0, z=oz; k < nz; ++k, z+=distance) {
			for (var j=0, y=oy; j < ny; ++j, y+=distance) {
				for (var i=0, x=ox; i < nx; ++i, x+=distance) {
					var noise = (Math.random() - 0.5) * vary * diameter;
					particle[ii].x[0] = x + noise;
					particle[ii].x[1] = y + noise;
					particle[ii].x[2] = z + noise;
					++ii;
				}
			} 
		}
	}

	//////////
	// Face //
	//////////
	function Face () {
		this.x = V3.O();
		this.n = V3.O();
	}
	function initFace (face, x0, x1) {
		var cx = x0[0] + (x1[0] - x0[0]) * 0.5;
		var cy = x0[1] + (x1[1] - x0[1]) * 0.5;
		var cz = x0[2] + (x1[2] - x0[2]) * 0.5;
		for (var i=0; i < face.length; ++i) {
			(function (face, i, x0, x1, cx, cy, cz) {
				switch (i) {
					case 0: // -x
						face.x[0] = x0[0]; face.x[1] =    cy; face.x[2] =    cz;
						face.n[0] =     1; face.n[1] =     0; face.n[2] =     0;
						break;
					case 1: // +x
						face.x[0] = x1[0]; face.x[1] =    cy; face.x[2] =    cz;
						face.n[0] =    -1; face.n[1] =     0; face.n[2] =     0;
						break;
					case 2: // -y
						face.x[0] =    cx; face.x[1] = x0[1]; face.x[2] =    cz;
						face.n[0] =     0; face.n[1] =     1; face.n[2] =     0;
						break;
					case 3: // +y
						face.x[0] =    cx; face.x[1] = x1[1]; face.x[2] =    cz;
						face.n[0] =     0; face.n[1] =    -1; face.n[2] =     0;
						break;
					case 4: // -z
						face.x[0] =    cx; face.x[1] =    cy; face.x[2] = x0[2];
						face.n[0] =     0; face.n[1] =     0; face.n[2] =     1;
						break;
					case 5: // +z
						face.x[0] =    cx; face.x[1] =    cy; face.x[2] = x1[2];
						face.n[0] =     0; face.n[1] =     0; face.n[2] =    -1;
						break;
					default:
						break;
				}
			} (face[i], i, x0, x1, cx, cy, cz));
		} // end of for i
	}
};

RbodySystem.prototype.update = function() {
	this.updateMomentum();
	this.updateState();
};

RbodySystem.prototype.updateMomentum = function() {
	var numBody  = this.body.length;
	var numBound = this.bound.length;
	
	var dt     = this.dt;
	var radius = this.radius;
	var Ks     = this.Kspring;
	var Kd     = this.Kdamping;
	var Kf     = this.Kfriction;
	var gf     = this.gf;

	var diameter = radius + radius;
	for (var i=0; i < numBody; ++i) {
		var xi = this.body[i].x;
		var vi = this.body[i].v;
		var Pi = this.body[i].P;

		var fi = [gf[0], gf[1], gf[2]];
		// vs perticle collision
		for (var j=0; j < numBody; ++j) {
			if (i == j) continue;
			var xj = this.body[j].x;
			var vj = this.body[j].v;

			var dx = xj[0] - xi[0]; 
			var dy = xj[1] - xi[1]; 
			var dz = xj[2] - xi[2];
			var ld = Math.sqrt(dx * dx + dy * dy + dz * dz);
			var overlap = diameter - ld;
			if (overlap < 0) continue;

			var invLd = 1 / ld;
			var n = [ invLd * dx, invLd * dy, invLd * dz];
			var v = [vj[0] - vi[0], vj[1] - vi[1], vj[2] - vi[2]];
			updateFi(radius, overlap, n, v, Ks, Kd, Kf, fi);
		}
		// vs boundary collision
		for (var j=0; j < numBound; ++j) {
			var xj = this.bound[j].x;
			var nj = this.bound[j].n;

			var dx = xj[0] - xi[0];
			var dy = xj[1] - xi[1];
			var dz = xj[2] - xi[2];

			var nx = - nj[0];
			var ny = - nj[1];
			var nz = - nj[2];

			var ld = dx * nx + dy * ny + dz * nz;
			var overlap = radius - ld;
			if (overlap < 0) continue;

			var n = [ nx, ny, nz];
			var v = [0 - vi[0], 0 - vi[1], 0 - vi[2]];
			updateFi(radius, overlap, n, v, Ks, Kd, Kf, fi);
		}
		
		// update momentum
		Pi[0] = Pi[0] + dt * fi[0];
		Pi[1] = Pi[1] + dt * fi[1];
		Pi[2] = Pi[2] + dt * fi[2];
	}
	
	////////////////////
	// local function //
	////////////////////
	function updateFi(radius, overlap, n, v, Ks, Kd, Kf, fi) {
		var rx = radius * n[0];
		var ry = radius * n[1];
		var rz = radius * n[2];

		var lvn = v[0] * n[0] + v[1] * n[1] + v[2] * n[2];
		var vnx = lvn * n[0];
		var vny = lvn * n[1];
		var vnz = lvn * n[2];

		var vtx = v[0] - vnx;
		var vty = v[1] - vny;
		var vtz = v[2] - vnz;

		var oKs = - overlap * Ks;
		var fx = oKs * n[0] + Kd * vnx + Kf * vtx;
		var fy = oKs * n[1] + Kd * vny + Kf * vty;
		var fz = oKs * n[2] + Kd * vnz + Kf * vtz;

		// update force
		fi[0] = fi[0] + fx;
		fi[1] = fi[1] + fy;
		fi[2] = fi[2] + fz;
	}
};

RbodySystem.prototype.updateState = function () {
	var numBody = this.body.length;
	var dt        = this.dt;
	var invMass   = 1 / this.mass;
	var invI0     = this.invI0;

	for (var i=0; i < numBody; ++i) {
		var xi = this.body[i].x;
		var vi = this.body[i].v;
		var Pi = this.body[i].P;

		// update linear velocity
		vi[0] = invMass * Pi[0];
		vi[1] = invMass * Pi[1];
		vi[2] = invMass * Pi[2];

		// update position
		xi[0] = xi[0] + dt * vi[0];
		xi[1] = xi[1] + dt * vi[1];
		xi[2] = xi[2] + dt * vi[2];
	}
};

/*
RbodySystem.prototype.updateBucket = function () {
	var bucket    = this.bucket;
	var dim = this.bucketDim;
	var x0  = this.bucketX0;
	var x1  = this.bucketX1;
	
	var szx = (x1[0] - x0[0]) / bucketDim[0];
	var szy = (x1[1] - x0[1]) / bucketDim[1];
	var szz = (x1[2] - x0[2]) / bucketDim[2];
	var invSzx = 1 / szx;
	var invSzy = 1 / szy;
	var invSzz = 1 / szz;
	
	var dimxy = dim[0] * dim[1];
	var dimX  = dim[0];
	
	for (var i=0; i < numBody; ++i) {
		var xi = this.body[i].x;
		
		var x = xi[0] - x0x;
		var y = xi[1] - x0y;
		var z = xi[2] - x0z;
		
		var ix = Math.floor(xi[0] / szx );
		var iy = Math.floor(xi[1] / szy );
		var iz = Math.floor(xi[2] / szz );
		
		var b = dimxy * iz + dimx * iy + ix;
		
		bucket[b].push(i);
	}
};
*/

/* 
 * 
 * Vector 3
 * 
 */
var V3 = {};
V3.create = function (x, y, z) {
	return [x, y, z];
};
V3.set = function (x, y, z, dst) {
	if (! dst ) dst = [];
	dst[0] = x;
	dst[1] = y;
	dst[2] = z;
	return dst;
};
V3.O = function (dst) {
	if ( ! dst ) dst = [];
	dst[0] = 0;
	dst[1] = 0;
	dst[2] = 0;
	return dst;
};
V3.add = function (v0, v1, dst) {
	var x = v0[0] + v1[0];
	var y = v0[1] + v1[1];
	var z = v0[2] + v1[2];
	if ( ! dst ) dst = [];
	dst[0] = x;
	dst[1] = y;
	dst[2] = z;
	return dst;
};
V3.sub = function (v0, v1, dst) {
	var x = v0[0] - v1[0];
	var y = v0[1] - v1[1];
	var z = v0[2] - v1[2];
	if ( ! dst ) dst = [];
	dst[0] = x;
	dst[1] = y;
	dst[2] = z;
	return dst;
};
V3.scale = function (v, s, dst) {
	var x = s * v[0];
	var y = s * v[1];
	var z = s * v[2];
	if ( ! dst ) dst = [];
	dst[0] = x;
	dst[1] = y;
	dst[2] = z;
	return dst;
};
V3.negate = function (v, dst) {
	var x = - v[0];
	var y = - v[1];
	var z = - v[2];
	if ( ! dst ) dst = [];
	dst[0] = x;
	dst[1] = y;
	dst[2] = z;
	return dst;
};
V3.normalize = function (v, dst) {
	var x = v[0];
	var y = v[1];
	var z = v[2];
	var invL = 1.0 / Math.sqrt(x*x + y*y + z*z);
	if ( ! dst ) dst = [];
	dst[0] = invL * x;
	dst[1] = invL * y;
	dst[2] = invL * z;
	return dst;
};
V3.cross = function (v0, v1, dst) {
	var x = v0[1]*v1[2] - v0[2]*v1[1];
	var y = v0[2]*v1[0] - v0[0]*v1[2];
	var z = v0[0]*v1[1] - v0[1]*v1[0];	
	if ( ! dst ) dst = [];
	dst[0] = x;
	dst[1] = y;
	dst[2] = z;
	return dst;
};
V3.length = function (v) {
	return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]); 
};
V3.length2 = function (v) {
	return v[0]*v[0] + v[1]*v[1] + v[2]*v[2]; 
};
V3.dot = function (v0, v1) {
	return v0[0]*v1[0] + v0[1]*v1[1] + v0[2]*v1[2]; 
};

/* 
 * 
 * Matrix 3x3
 * 
 */
var M3x3 = {};
M3x3.create = function (m00, m01, m02, m10, m11, m12, m20, m21, m22) {
	return [m00, m01, m02, m10, m11, m12, m20, m21, m22];
};
M3x3.set = function (m00, m01, m02, m10, m11, m12, m20, m21, m22, dst) {
	if ( ! dst ) dst = [];
	dst[0] = m00; dst[1] = m01; dst[2] = m02;
	dst[3] = m10; dst[4] = m11; dst[5] = m12;
	dst[6] = m20; dst[7] = m21; dst[8] = m22;
	return dst;
};
M3x3.I = function (dst) {
	if ( ! dst ) dst = [];
	dst[0] = 1; dst[1] = 0; dst[2] = 0;
	dst[3] = 0; dst[4] = 1; dst[5] = 0;
	dst[6] = 0; dst[7] = 0; dst[8] = 1;
	return dst;
};
M3x3.O = function (dst) {
	if ( ! dst ) dst = [];
	dst[0] = 0; dst[1] = 0; dst[2] = 0;
	dst[3] = 0; dst[4] = 0; dst[5] = 0;
	dst[6] = 0; dst[7] = 0; dst[8] = 0;
	return dst;
};
M3x3.MM = function (m0, m1, dst) {
	//row 0
	var m00 = m0[0]*m1[0] + m0[1]*m1[3] + m0[2]*m1[6];
	var m01 = m0[0]*m1[1] + m0[1]*m1[4] + m0[2]*m1[7];
	var m02 = m0[0]*m1[2] + m0[1]*m1[5] + m0[2]*m1[8];
	//row 1
	var m10 = m0[3]*m1[0] + m0[4]*m1[3] + m0[5]*m1[6];
	var m11 = m0[3]*m1[1] + m0[4]*m1[4] + m0[5]*m1[7];
	var m12 = m0[3]*m1[2] + m0[4]*m1[5] + m0[5]*m1[8];
	//row 2
	var m20 = m0[6]*m1[0] + m0[7]*m1[3] + m0[8]*m1[6];
	var m21 = m0[6]*m1[1] + m0[7]*m1[4] + m0[8]*m1[7];
	var m22 = m0[6]*m1[2] + m0[7]*m1[5] + m0[8]*m1[8];
	if ( ! dst ) dst = [];
	dst[0] = m00; dst[1] = m01; dst[2] = m02;
	dst[3] = m10; dst[4] = m11; dst[5] = m12;
	dst[6] = m20; dst[7] = m21; dst[8] = m22;
	return dst;
};
M3x3.MV = function (m, v, dst) {
	var x = m[0]*v[0] + m[1]*v[1] + m[2]*v[2];
	var y = m[3]*v[0] + m[4]*v[1] + m[5]*v[2];
	var z = m[6]*v[0] + m[7]*v[1] + m[8]*v[2];
	if ( ! dst ) dst = [];
	dst[0] = x;
	dst[1] = y;
	dst[2] = z;
	return dst;
};
M3x3.transpose = function (m, dst) {
	//row 0
	var m00 = m[0];
	var m01 = m[3];
	var m02 = m[6];
	//row 1
	var m10 = m[1];
	var m11 = m[4];
	var m12 = m[7];
	//row 2
	var m20 = m[2];
	var m21 = m[5];
	var m22 = m[8];
	if ( ! dst ) dst = [];
	dst[0] = m00; dst[1] = m01; dst[2] = m02;
	dst[3] = m10; dst[4] = m11; dst[5] = m12;
	dst[6] = m20; dst[7] = m21; dst[8] = m22;
	return dst;
};

/* 
 * 
 * Quotanion 
 * 
 */
var Q4 = {};
Q4.O = function (dst) {
	if ( ! dst ) dst = [];
	dst[0] = 0;
	dst[1] = 0;
	dst[2] = 0;
	dst[3] = 0;
	return dst;
};
Q4.create = function (w, x, y, z) {
	var dst = [];
	dst[0] = w;
	dst[1] = x;
	dst[2] = y;
	dst[3] = z;
	return dst;
};
Q4.add = function (q0, q1, dst) {
	var w = q0[0] + q1[0];
	var x = q0[1] + q1[1];
	var y = q0[2] + q1[2];
	var z = q0[3] + q1[3];
	if ( ! dst ) dst = [];
	dst[0] = w;
	dst[1] = x;
	dst[2] = y;
	dst[3] = z;
	return dst;
}
Q4.set = function (w, x, y, z, dst) {
	if ( ! dst ) dst = [];
	dst[0] = w;
	dst[1] = x;
	dst[2] = y;
	dst[3] = z;
	return dst;
};
Q4.make = function (axisX, axisY, axisZ, angle, dst) {
	var hA = 0.5 * angle; 
	var c = Math.cos(hA);
	var s = Math.sin(hA);
	var w = c;
	var x = s * axisX;
	var y = s * axisY;
	var z = s * axisZ;
	if ( ! dst ) dst = [];
	dst[0] = w;
	dst[1] = x;
	dst[2] = y;
	dst[3] = z;
	return dst;
};
Q4.scale = function (q, s, dst) {
	var w = s * q[0];
	var x = s * q[1];
	var y = s * q[2];
	var z = s * q[3];
	if ( ! dst ) dst = [];
	dst[0] = w;
	dst[1] = x;
	dst[2] = y;
	dst[3] = z;
	return dst;
};
Q4.mul = function (q0, q1, dst) {
	var w = q0[0] * q1[0] - q0[1] * q1[1] - q0[2] * q1[2] - q0[3] * q1[3];
	var x = q0[2] * q1[3] - q0[3] * q1[2] + q0[0] * q1[1] + q0[1] * q1[0];
	var y = q0[3] * q1[1] - q0[1] * q1[3] + q0[0] * q1[2] + q0[2] * q1[0];
	var z = q0[1] * q1[2] - q0[2] * q1[1] + q0[0] * q1[3] + q0[3] * q1[0];
	if ( ! dst ) dst = [];
	dst[0] = w;
	dst[1] = x;
	dst[2] = y;
	dst[3] = z;
	return dst;
};
Q4.normalize = function(q, dst) {
	var w = q[0];
	var x = q[1];
	var y = q[2];
	var z = q[3];
	var invL = 1 / Math.sqrt(x*x + y*y + z*z + w*w);
	if ( ! dst ) dst = [];
	dst[0] = invL * w;
	dst[1] = invL * x;
	dst[2] = invL * y;
	dst[3] = invL * z;
	return dst;
};
Q4.length = function(q) {
	var w = q[0];
	var x = q[1];
	var y = q[2];
	var z = q[3];
	return Math.sqrt(x*x + y*y + z*z + w*w);
};
Q4.toM3x3 = function (q, dst) {
	var xx2 = q[1] * q[1] * 2;
	var yy2 = q[2] * q[2] * 2;
	var zz2 = q[3] * q[3] * 2;
	var xy2 = q[1] * q[2] * 2;
	var xz2 = q[1] * q[3] * 2;
	var yz2 = q[2] * q[3] * 2;
	var wx2 = q[0] * q[1] * 2;
	var wy2 = q[0] * q[2] * 2;
	var wz2 = q[0] * q[3] * 2;
	//row 0
	var m00 = 1 - yy2 - zz2;
	var m01 = xy2 - wz2;
	var m02 = xz2 + wy2;
	//row 1
	var m10 = xy2 + wz2;
	var m11 = 1 - xx2 - zz2;
	var m12 = yz2 - wx2;
	//row 2
	var m20 = xz2 - wy2;
	var m21 = yz2 + wx2;
	var m22 = 1 - xx2 - yy2;
	if ( ! dst ) dst = [];
	dst[0] = m00; dst[1] = m01; dst[2] = m02; // row 0
	dst[3] = m10; dst[4] = m11; dst[5] = m12; // row 1
	dst[6] = m20; dst[7] = m21; dst[8] = m22; // row 2
	return dst;
};
