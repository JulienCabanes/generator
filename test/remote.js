/*global describe, it, before, beforeEach */
'use strict';
var os = require('os');
var path = require('path');
var fs = require('fs');
var assert = require('assert');
var yeoman = require('yeoman-environment');
var nock = require('nock');
var sinon = require('sinon');
var TestAdapter = require('yeoman-test/lib/adapter').TestAdapter;
var tmpdir = path.join(os.tmpdir(), 'yeoman-remote');
var helpers = require('yeoman-test');
var generators = require('..');

describe('generators.Base#remote()', function () {
  before(helpers.setUpTestDirectory(tmpdir));

  beforeEach(function () {
    this.env = yeoman.createEnv([], {}, new TestAdapter());
    var Dummy = generators.Base.extend({
      exec: sinon.spy()
    });
    this.env.registerStub(Dummy, 'dummy');
    this.dummy = this.env.create('dummy');
    nock('https://github.com')
      .get('/yeoman/generator/archive/master.tar.gz')
      .replyWithFile(200, path.join(__dirname, 'fixtures/testRemoteFile.tar.gz'));
  });

  it('remotely fetch a package on github', function (done) {
    this.dummy.remote('yeoman', 'generator', done);
  });

  it('cache the result internally into a `_cache` folder', function (done) {
    this.dummy.remote('yeoman', 'generator', function () {
      fs.stat(path.join(this.dummy.cacheRoot(), 'yeoman/generator/master'), done);
    }.bind(this));
  });

  it('invoke `cb` with a remote object to interract with the downloaded package', function (done) {
    this.dummy.remote('yeoman', 'generator', function (err, remote) {
      if (err) {
        done(err);
        return;
      }

      assert.implement(remote, ['copy', 'template', 'directory']);
      done();
    });
  });

  describe('github', function () {
    describe('callback argument remote#copy', function () {
      beforeEach(function (done) {
        this.dummy.remote('yeoman', 'generator', 'master', function (err, remote) {
          this.dummy.foo = 'foo';
          remote.copy('test/fixtures/template.jst', 'remote-githug/template.js');
          this.dummy._writeFiles(done);
        }.bind(this), true);
      });

      it('copy a file from a remote resource', function () {
        var data = fs.readFileSync('remote-githug/template.js');
        assert.equal(data, 'var foo = \'foo\';\n');
      });
    });

    describe('callback argument remote#bulkCopy', function () {
      beforeEach(function (done) {
        this.dummy.remote('yeoman', 'generator', 'master', function (err, remote) {
          remote.bulkCopy('test/fixtures/foo-template.js', 'remote-githug/foo-template.js');
          this.dummy._writeFiles(done);
        }.bind(this), true);
      });

      it('copy a file from a remote resource', function (done) {
        fs.stat('remote-githug/foo-template.js', done);
      });

      it('doesn\'t process templates on bulkCopy', function () {
        var data = fs.readFileSync('remote-githug/foo-template.js');
        assert.equal(data, 'var <%= foo %> = \'<%= foo %>\';\n');
      });
    });

    describe('callback argument remote#directory', function () {
      beforeEach(function (done) {
        this.dummy.remote('yeoman', 'generator', 'master', function (err, remote) {
          remote.directory('test/generators', 'remote-githug/generators');
          this.dummy._writeFiles(done);
        }.bind(this), true);
      });

      it('copy a directory from a remote resource', function (done) {
        fs.stat('remote-githug/generators/test-angular.js', done);
      });
    });

    describe('callback argument remote#bulkDirectory', function () {
      beforeEach(function (done) {
        this.dummy.remote('yeoman', 'generator', 'master', function (err, remote) {
          remote.bulkDirectory('test/fixtures', 'remote-githug/fixtures');
          this.dummy.conflicter.force = true;
          this.dummy.conflicter.resolve(done);
        }.bind(this), true);
      });

      it('copy a directory from a remote resource', function (done) {
        fs.stat('remote-githug/fixtures/foo.js', done);
      });

      it('doesn\'t process templates on bulkDirectory', function () {
        var data = fs.readFileSync('remote-githug/fixtures/foo-template.js');
        assert.equal(data, 'var <%= foo %> = \'<%= foo %>\';\n');
      });
    });
  });

  describe('absolute', function () {
    describe('callback argument remote#copy', function () {
      beforeEach(function (done) {
        this.dummy.foo = 'foo';
        this.dummy.remote('https://github.com/yeoman/generator/archive/master.tar.gz', function (err, remote) {
          remote.copy('test/fixtures/template.jst', 'remote-absolute/template.js');
          this.dummy._writeFiles(done);
        }.bind(this), true);
      });

      it('copy a file from a remote resource', function () {
        var data = fs.readFileSync('remote-absolute/template.js');
        assert.equal(data, 'var foo = \'foo\';\n');
      });
    });

    describe('callback argument remote#bulkCopy', function () {
      beforeEach(function (done) {
        this.dummy.remote('https://github.com/yeoman/generator/archive/master.tar.gz', function (err, remote) {
          remote.bulkCopy('test/fixtures/foo-template.js', 'remote-absolute/foo-template.js');
          this.dummy.conflicter.force = true;
          this.dummy.conflicter.resolve(done);
        }.bind(this), true);
      });

      it('copy a file from a remote resource', function (done) {
        fs.stat('remote-absolute/foo-template.js', done);
      });

      it('doesn\'t process templates on bulkCopy', function () {
        var data = fs.readFileSync('remote-absolute/foo-template.js');
        assert.equal(data, 'var <%= foo %> = \'<%= foo %>\';\n');
      });
    });

    describe('callback argument remote#directory', function () {
      beforeEach(function (done) {
        this.dummy.remote('https://github.com/yeoman/generator/archive/master.tar.gz', function (err, remote) {
          remote.directory('test/generators', 'remote-absolute/generators');
          this.dummy._writeFiles(done);
        }.bind(this), true);
      });

      it('copy a directory from a remote resource', function (done) {
        fs.stat('remote-absolute/generators/test-angular.js', done);
      });
    });

    describe('callback argument remote#bulkDirectory', function () {
      beforeEach(function (done) {
        this.dummy.remote('https://github.com/yeoman/generator/archive/master.tar.gz', function (err, remote) {
          remote.bulkDirectory('test/fixtures', 'remote-absolute/fixtures');
          this.dummy.conflicter.force = true;
          this.dummy.conflicter.resolve(done);
        }.bind(this), true);
      });

      it('copy a directory from a remote resource', function (done) {
        fs.stat('remote-absolute/fixtures/foo.js', done);
      });

      it('doesn\'t process templates on bulkDirectory', function () {
        var data = fs.readFileSync('remote-absolute/fixtures/foo-template.js');
        assert.equal(data, 'var <%= foo %> = \'<%= foo %>\';\n');
      });
    });
  });
});
