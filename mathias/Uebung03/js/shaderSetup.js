// Shadervariablen des Programms
function findShaderVariables(program) {
	var obj = null;
	var loc = null;
	var i, n, glErr;

	// get number of uniforms
	n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

	for ( i = 0; i < n; i++) {
		obj = gl.getActiveUniform(program, i);

		glErr = gl.getError();
		if (glErr || !obj) {
			console.error("GL error on searching uniforms: " + glErr);
			continue;
		}

		loc = gl.getUniformLocation(program, obj.name);
		// dynamically attach uniform reference to program object
		program[obj.name] = loc;
	}

	// get number of attributes
	n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

	for ( i = 0; i < n; i++) {
		obj = gl.getActiveAttrib(program, i);

		glErr = gl.getError();
		if (glErr || !obj) {
			console.error("GL error on searching attributes: " + glErr);
			continue;
		}

		loc = gl.getAttribLocation(program, obj.name);
		// dynamically attach attribute index to program object
		program[obj.name] = loc;
	}
}

// create shader part
function getShader(source, type) {
	var shader = null;

	switch (type) {
		case "vertex":
			shader = gl.createShader(gl.VERTEX_SHADER);
			break;
		case "fragment":
			shader = gl.createShader(gl.FRAGMENT_SHADER);
			break;
		default:
			return null;
	}

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.warn(type + "Shader: " + gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

// create shader program
function initShader(vertexShaderStr, fragmentShaderStr) {
	var vs = getShader(vertexShaderStr, "vertex");
	var fs = getShader(fragmentShaderStr, "fragment");

	if (vs && fs) {
		var program = gl.createProgram();

		gl.attachShader(program, vs);
		gl.attachShader(program, fs);

		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.warn("Could not link program: " + gl.getProgramInfoLog(program));
			return null;
		}

		findShaderVariables(program);

		return program;
	}
	return null;
}

function initTexture(url) {
	var texture = gl.createTexture();
	texture.ready = false;

	var image = new Image();
	image.crossOrigin = '';
	image.src = url;

	image.onload = function() {
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.bindTexture(gl.TEXTURE_2D, null);

		// save image size and ready state
		texture.width = image.width;
		texture.height = image.height;
		texture.ready = true;
	};

	image.onerror = function() {
		console.error("Cannot load image '" + url + "'!");
	};

	return texture;
}