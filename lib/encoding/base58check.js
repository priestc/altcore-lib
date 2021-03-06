'use strict';

var _ = require('lodash');
var Base58 = require('./base58');
var buffer = require('buffer');
var sha256sha256 = require('../crypto/hash').sha256sha256;
var groestl = require('../crypto/hash').groestl;

var Base58Check = function Base58Check(obj) {
  if (!(this instanceof Base58Check))
    return new Base58Check(obj);
  if (Buffer.isBuffer(obj)) {
    var buf = obj;
    this.fromBuffer(buf);
  } else if (typeof obj === 'string') {
    var str = obj;
    this.fromString(str);
  } else if (obj) {
    this.set(obj);
  }
};

Base58Check.prototype.set = function(obj) {
  this.buf = obj.buf || this.buf || undefined;
  return this;
};

Base58Check.validChecksum = function validChecksum(data, checksum, hash_algo) {

  if (_.isString(data)) {
    data = new buffer.Buffer(Base58.decode(data));
  }
  if (_.isString(checksum)) {
    checksum = new buffer.Buffer(Base58.decode(checksum));
  }
  if (!checksum) {
    checksum = data.slice(-4);
    data = data.slice(0, -4);
  }
  return Base58Check.checksum(data, hash_algo).toString('hex') === checksum.toString('hex');
};

Base58Check.decode = function(s, hash_algo) {
  if (typeof s !== 'string')
    throw new Error('Input must be a string');

  var buf = new Buffer(Base58.decode(s));

  if (buf.length < 4)
    throw new Error("Input string too short");

  var data = buf.slice(0, -4);
  var csum = buf.slice(-4);

  if(hash_algo == 'double-sha256' || !hash_algo) {
      var hash = sha256sha256(data);
  } else if(hash_algo == 'groestl') {
      var hash = groestl(data);
  }

  var hash4 = hash.slice(0, 4);

  if (csum.toString('hex') !== hash4.toString('hex'))
    throw new Error("Checksum mismatch");

  return data;
};

Base58Check.checksum = function(buffer, hash_algo) {
  if(hash_algo == 'double-sha256' || !hash_algo) {
      var hash = sha256sha256(buffer);
  } else if(hash_algo == 'groestl') {
      var hash = groestl(buffer);
  }
  return hash.slice(0, 4);
};

Base58Check.encode = function(buf, hash_algo) {
  if (!Buffer.isBuffer(buf))
    throw new Error('Input must be a buffer');
  var checkedBuf = new Buffer(buf.length + 4);
  var hash = Base58Check.checksum(buf, hash_algo);
  buf.copy(checkedBuf);
  hash.copy(checkedBuf, buf.length);
  return Base58.encode(checkedBuf);
};

Base58Check.prototype.fromBuffer = function(buf) {
  this.buf = buf;
  return this;
};

Base58Check.prototype.fromString = function(str) {
  var buf = Base58Check.decode(str, this.hash_algo);
  this.buf = buf;
  return this;
};

Base58Check.prototype.toBuffer = function() {
  return this.buf;
};

Base58Check.prototype.toString = function() {
  return Base58Check.encode(this.buf);
};

module.exports = Base58Check;
