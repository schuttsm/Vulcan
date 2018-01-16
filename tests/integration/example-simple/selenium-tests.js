const wdio = require('wdio');
const chai = require('chai');

describe('integration tests', function() {
  this.timeout(1000 * 60);
  var browser;
  var testUser = 'testUser', testPwd = 'testPwd', testEmail = 'test@test.com';
  before(function() {
    console.log('starting')
    browser = wdio.getBrowser({desiredCapabilities: {browserName: 'chrome'}});
    browser.init();
    browser.url('http://localhost:3000/');
    browser.waitForVisible('#usernameOrEmail');
    chai.assert.equal('Your site title', browser.getTitle());
  });

  after(function() {
    browser.end();
  });

  it('should signup correctly', function() {
    chai.assert.deepEqual(browser.getText('.buttons a:nth-child(2)'), 'Sign up');
    browser.click('.buttons a:nth-child(2)');
    browser.waitForVisible('#username');
    browser.setValue('#username', testUser);
    browser.setValue('#email', testEmail);
    browser.setValue('#password', testPwd);
    browser.click('[type="submit"]');
    browser.waitUntil(function () {
      return browser.getText('.buttons a') == 'Change password';
    }, 5000, 'Change button did not appear 5s after login');
    chai.assert.deepEqual(browser.getText('.btn-primary'), ['Sign out', 'Submit']);
  });

  it('should signout correctly', function() {
    browser.click('.btn-primary:nth-child(1)');
    browser.waitForVisible('#usernameOrEmail');
  });

  it('should prevent a second login of the same user', () => {
    chai.assert.deepEqual(browser.getText('.btn-primary'), 'Sign in');
    browser.click('.buttons a:nth-child(2)');
    browser.waitForVisible('#username');
    browser.setValue('#username', testUser);
    browser.setValue('#email', testEmail);
    browser.setValue('#password', testPwd);
    browser.click('[type="submit"]');
    browser.waitForVisible('.message.error');
    chai.assert.equal(browser.getText('.message.error'), 'Username already exists');
  });

  it('should login correctly', function() {
    chai.assert.deepEqual(browser.getText('.buttons a:nth-child(2)'), 'Sign in');
    browser.click('.buttons a:nth-child(2)');
    browser.waitForVisible('#usernameOrEmail');
    browser.setValue('#usernameOrEmail', testEmail);
    browser.setValue('#password', testPwd);
    browser.click('[type="submit"]');
    browser.waitUntil(function () {
      return browser.getText('.buttons a') == 'Change password';
    }, 5000, 'Change button did not appear 5s after login');
    chai.assert.equal(browser.getText('.buttons a'), 'Change password');
    chai.assert.deepEqual(browser.getText('.btn-primary'), ['Sign out', 'Submit']);
  });
});
