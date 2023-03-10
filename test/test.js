#!/usr/bin/env node

/* jshint esversion: 8 */
/* global describe */
/* global before */
/* global after */
/* global it */
/* global xit */

'use strict';

require('chromedriver');

const execSync = require('child_process').execSync,
    expect = require('expect.js'),
    path = require('path'),
    { Builder, By, Key, until } = require('selenium-webdriver'),
    { Options } = require('selenium-webdriver/chrome');

describe('Application life cycle test', function () {
    this.timeout(0);

    const LOCATION = 'test';
    const TEST_TIMEOUT = 10000;
    const EXEC_ARGS = { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' };
    const EMAIL = 'admin@cloudron.local';
    const PASSWORD = 'Test1234';
    const FIRST_NAME = 'Herbert';
    const LAST_NAME = 'Cloudroner';
    const workflow_file_url = 'https://git.cloudron.io/cloudron/n8n-app/-/raw/master/test/Cloudron_Test_Workflow.json';

    let browser, app;

    before(function () {
        browser = new Builder().forBrowser('chrome').setChromeOptions(new Options().windowSize({ width: 1280, height: 1024 })).build();
    });

    after(function () {
        browser.quit();
    });

    function sleep(millis) {
        return new Promise(resolve => setTimeout(resolve, millis));
    }

    async function waitForElement(elem) {
        await sleep(1000);
        await browser.wait(until.elementLocated(elem), TEST_TIMEOUT);
        await browser.wait(until.elementIsVisible(browser.findElement(elem)), TEST_TIMEOUT);
    }

    function getAppInfo() {
        const inspect = JSON.parse(execSync('cloudron inspect'));
        app = inspect.apps.filter(function (a) { return a.location.indexOf(LOCATION) === 0; })[0];
        expect(app).to.be.an('object');
    }

    async function setup() {
        await browser.get(`https://${app.fqdn}/setup`);

        await waitForElement(By.xpath('//input[@autocomplete="email"]'));

        await browser.findElement(By.xpath('//input[@autocomplete="email"]')).sendKeys(EMAIL);
        await browser.findElement(By.xpath('//input[@autocomplete="given-name"]')).sendKeys(FIRST_NAME);
        await browser.findElement(By.xpath('//input[@autocomplete="family-name"]')).sendKeys(LAST_NAME);
        await browser.findElement(By.xpath('//input[@autocomplete="new-password"]')).sendKeys(PASSWORD);
        await browser.findElement(By.xpath('//button//span[contains(text(), "Next")]')).click();

        // initials from FIRST_NAME and LAST_NAME
        await waitForElement(By.xpath('//span[text()="HC"]'));
    }

    async function login() {
        await browser.get(`https://${app.fqdn}/signin`);

        await waitForElement(By.xpath('//input[@autocomplete="email"]'));

        await browser.findElement(By.xpath('//input[@autocomplete="email"]')).sendKeys(EMAIL);
        await browser.findElement(By.xpath('//input[@autocomplete="current-password"]')).sendKeys(PASSWORD);
        await browser.findElement(By.xpath('//button//span[contains(text(), "Sign in")]')).click();

        await waitForElement(By.xpath('//span[text()="HC"]'));
    }

    async function logout() {
        await browser.get(`https://${app.fqdn}`);

        // close sidebar
        await waitForElement(By.id('collapse-change-button'));
        await browser.findElement(By.id('collapse-change-button')).click();
        await sleep(2000);

        await waitForElement(By.xpath('//span[text()="HC"]'));
        await browser.findElement(By.xpath('//span[text()="HC"]')).click();

        await waitForElement(By.xpath('//li[contains(text(), "Sign out")]'));
        await browser.findElement(By.xpath('//li[contains(text(), "Sign out")]')).click();

        await waitForElement(By.xpath('//input[@autocomplete="email"]'));
    }

    const saveButtonXpath = '//span[@class="actions"]//span[text()="Save"]';

    async function openWorkflow() {
        await browser.get(`https://${app.fqdn}/workflows`);

        // Find element with text "Cloudron Test Workflow" and click it.
        await waitForElement(By.xpath(`//h2[contains(text(), "My workflow")]`));
        await browser.findElement(By.xpath(`//h2[contains(text(), "My workflow")]`)).click();

        await waitForElement(By.xpath(`//span[@title="My workflow"]`));
        await sleep(500);
    }

    async function importWorkflowFromUrl() {
        await browser.get(`https://${app.fqdn}/workflow/new`);

        await waitForElement(By.xpath('//span[@class="actions"]//div[@class="action-dropdown-container"]/div/div'));
        await browser.findElement(By.xpath('//span[@class="actions"]//div[@class="action-dropdown-container"]/div/div')).click();

        // click Import from URL
        await waitForElement(By.xpath('//li[@class="el-dropdown-menu__item"]//span[contains(text(),"Import from URL")]'));
        await browser.findElement(By.xpath('//li[@class="el-dropdown-menu__item"]//span[contains(text(),"Import from URL")]')).click();

        // Paste URL for file
        await waitForElement(By.xpath('//div[@class="el-message-box__input"]//input'));
        await browser.findElement(By.xpath('//div[@class="el-message-box__input"]//input')).sendKeys(workflow_file_url);

        // click import
        await waitForElement(By.xpath('//span[contains(text(),"Import")]/parent::button'));
        await browser.findElement(By.xpath('//span[contains(text(),"Import")]/parent::button')).click();

        // Activate Workflow
        await waitForElement(By.xpath('//div[@title="Activate workflow"] | //div[@title="Activate Workflow"]'));
        await browser.findElement(By.xpath('//div[@title="Activate workflow"] | //div[@title="Activate Workflow"]')).click();

        // wait for saving
        await sleep(1000);
    }

    async function checkWorkflowData(execNumber='1') {
        console.log(`Sleeping for 30sec to let the imported workflow generate some data in execution ${execNumber} . ${(new Date()).toString()}`);
        await sleep(30000);

        await browser.get(`https://${app.fqdn}`);

        await waitForElement(By.xpath('//li/span[text()="All executions"]'));
        await browser.findElement(By.xpath('//li/span[text()="All executions"]')).click();
        // Find Name of workflow
        await waitForElement(By.xpath(`//td/span[contains(text(), '${'My workflow'}')]`));
        // Find Sucess label
        await browser.findElement(By.xpath('//span[contains(text(), "Succeeded")]'));
    }

    // TEST START

    xit('build app', function () { execSync('cloudron build', EXEC_ARGS); });
    it('install app', function () { execSync(`cloudron install --location ${LOCATION}`, EXEC_ARGS); });

    it('can get app information', getAppInfo);
    it('can setup', setup);
    // it('can login', login);
    it('can import workflow from URL', importWorkflowFromUrl);
    it('check if workflow created data', checkWorkflowData);
    it('can logout', logout);

    it('can restart app', function () { execSync(`cloudron restart --app ${app.id}`, EXEC_ARGS); });
    it('can login', login);
    it('can open imported workflow', openWorkflow);
    it('check if workflow creates data', checkWorkflowData.bind(null, '3'));
    it('can logout', logout);

    it('backup app', function () { execSync(`cloudron backup create --app ${app.id}`, EXEC_ARGS); });
    it('restore app', function () {
        const backups = JSON.parse(execSync(`cloudron backup list --raw --app ${app.id}`));
        execSync(`cloudron uninstall --app ${app.id}`, EXEC_ARGS);
        execSync(`cloudron install --location ${LOCATION}`, EXEC_ARGS);
        getAppInfo();
        execSync(`cloudron restore --backup ${backups[0].id} --app ${app.id}`, EXEC_ARGS);
    });

    it('can login', login);
    it('can open imported workflow', openWorkflow);
    it('check if workflow creates data', checkWorkflowData.bind(null, '5'));
    it('can logout', logout);

    it('move to different location', async function () {
        // ensure we don't hit NXDOMAIN in the mean time
        await browser.get('about:blank');
        execSync(`cloudron configure --location ${LOCATION}2 --app ${app.id}`, EXEC_ARGS);
    });

    it('can get app information', getAppInfo);
    it('can login', login);
    it('can open imported workflow', openWorkflow);
    it('check if workflow creates data', checkWorkflowData.bind(null, '7'));

    it('uninstall app', async function () {
        // ensure we don't hit NXDOMAIN in the mean time
        await browser.get('about:blank');
        execSync(`cloudron uninstall --app ${app.id}`, EXEC_ARGS);
    });

    // test update
    it('can install app', function () { execSync(`cloudron install --appstore-id ${app.manifest.id} --location ${LOCATION}`, EXEC_ARGS); });
    it('can get app information', getAppInfo);
    it('can setup', setup);
    it('can import workflow from URL', importWorkflowFromUrl);
    it('check if workflow created data', checkWorkflowData);
    it('can logout', logout);

    it('can update', function () { execSync(`cloudron update --app ${app.id}`, EXEC_ARGS); });

    it('can login', login);
    it('can open imported workflow', openWorkflow);
    it('check if workflow creates data', checkWorkflowData.bind(null, '3'));

    it('uninstall app', async function () {
        // ensure we don't hit NXDOMAIN in the mean time
        await browser.get('about:blank');
        execSync(`cloudron uninstall --app ${app.id}`, EXEC_ARGS);
    });
});
