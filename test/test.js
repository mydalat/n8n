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
    const EMAIL = 'herbert@cloudron.io';
    const PASSWORD = 'Something?123';
    const FIRST_NAME = 'Herbert';
    const LAST_NAME = 'Cloudroner';
    const workflow_file_url = 'https://git.cloudron.io/cloudron/n8n-app/-/raw/master/test/Cloudron_Test_Workflow.json';
    const default_workflow_name = 'Cloudron Test Workflow';
    const default_workflow_import_name = 'Cloudron Imported Workflow';

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
        await browser.findElement(By.xpath('//button[@title="Next"]')).click();

        // initials from FIRST_NAME and LAST_NAME
        await waitForElement(By.xpath('//div[@class="avatar"]//span[text()="HC"]'));
    }

    async function login() {
        await browser.get(`https://${app.fqdn}/signin`);

        await waitForElement(By.xpath('//input[@autocomplete="email"]'));

        await browser.findElement(By.xpath('//input[@autocomplete="email"]')).sendKeys(EMAIL);
        await browser.findElement(By.xpath('//input[@autocomplete="current-password"]')).sendKeys(PASSWORD);
        await browser.findElement(By.xpath('//button[@title="Sign in"]')).click();

        await waitForElement(By.xpath('//div[@class="avatar"]//span[text()="HC"]'));
    }

    async function loginOld() {
        await browser.get(`https://${app.fqdn}/login`);

        await waitForElement(By.id('inputUsername'));

        await browser.findElement(By.id('inputUsername')).sendKeys(process.env.USERNAME);
        await browser.findElement(By.id('inputPassword')).sendKeys(process.env.PASSWORD);
        await browser.findElement(By.id('login')).click();

        await sleep(2000);

        await waitForElement(By.id('app'));
    }


    async function logout() {
        await browser.get(`https://${app.fqdn}`);

        await waitForElement(By.xpath('//div[@class="avatar"]//span[text()="HC"]'));
        await browser.findElement(By.xpath('//div[@class="avatar"]//span[text()="HC"]')).click();

        await waitForElement(By.xpath('//li[contains(text(), "Sign out")]'));
        await browser.findElement(By.xpath('//li[contains(text(), "Sign out")]')).click();

        await waitForElement(By.xpath('//input[@autocomplete="email"]'));
    }

    const saveButtonXpath = '//li[@title="Workflow"]//span[text()="Save"]';
    const addNodeButtonXpath = '//div[@class="plus-container"]/parent::div';
    const nodeSearchFieldXpath = '//div/input[@placeholder="Search nodes..."] | //div/input[@placeholder="Type to filter..."]';
    // const nodeCloseButtonXpath = '//button/i[contains(@class, "el-icon-close")]';

    async function openMenu() {
        await browser.get(`https://${app.fqdn}/`);
        await waitForElement(By.id('collapse-change-button'));
        await browser.findElement(By.id('collapse-change-button')).click();
        await sleep(2000);
    }

    async function createWorkflow() {
        await openMenu();
        // click Workflows in menu
        await waitForElement(By.xpath('//li[@title="Workflow"]'));
        await browser.findElement(By.xpath('//li[@title="Workflow"]')).click();
        // click New in Workflows
        await waitForElement(By.xpath('//li[@title="Workflow"]//span[text()="New"]'));
        await browser.findElement(By.xpath('//li[@title="Workflow"]//span[text()="New"]')).click();
        // click workflow name
        await waitForElement(By.xpath('//span[@class="name-container"]'));
        await browser.findElement(By.xpath('//span[@class="name-container"]')).click();
        // Clear the field
        await waitForElement(By.xpath('//span[@class="name-container"]//input'));
        await browser.findElement(By.xpath('//span[@class="name-container"]//input')).clear();

        await browser.findElement(By.xpath('//span[@class="name-container"]//input')).sendKeys(default_workflow_name);
        // Click save button
        await waitForElement(By.xpath(saveButtonXpath));
        await browser.findElement(By.xpath(saveButtonXpath)).click();
        // Add CoinGecko Node
        await waitForElement(By.xpath(addNodeButtonXpath));
        await browser.findElement(By.xpath(addNodeButtonXpath)).click();
        await waitForElement(By.xpath(nodeSearchFieldXpath));
        await browser.findElement(By.xpath(nodeSearchFieldXpath)).sendKeys('CoinGecko');
        // Click CoinGecko Node
        await waitForElement(By.xpath('//span[contains(text(), "CoinGecko")]'));
        await browser.findElement(By.xpath('//span[contains(text(), "CoinGecko")]')).click();
        // Close node config window
        await waitForElement(By.xpath('//html/body'));
        await browser.findElement(By.xpath('//html/body')).sendKeys(Key.ESCAPE); // clicking "close" button says element not interactible
        // Part missing to connect the nodes to create a functional workflow
        // save anyway
        await waitForElement(By.xpath(saveButtonXpath));
        await browser.findElement(By.xpath(saveButtonXpath)).click();
        await sleep(1000);
    }

    async function openWorkflow(workflowname=default_workflow_name) {
        await openMenu();
        // click Workflows in menu
        await waitForElement(By.xpath('//li[@title="Workflow"]'));
        await browser.findElement(By.xpath('//li[@title="Workflow"]')).click();
        // click open in Workflows
        await waitForElement(By.xpath('//li[@title="Workflow"]//span[text()="Open"]'));
        await browser.findElement(By.xpath('//li[@title="Workflow"]//span[text()="Open"]')).click();
        // Find element with text "Cloudron Test Workflow" and click it.
        await waitForElement(By.xpath(`//tr//td//span[contains(text(), '${workflowname}')]`));
        await browser.findElement(By.xpath(`//tr//td//span[contains(text(), '${workflowname}')]`)).click();
        await waitForElement(By.xpath(`//span[@title="${workflowname}"]`));
        await sleep(500);
    }

    async function importWorkflowFromUrl() {
        await openMenu();
        // click Workflows in menu
        await waitForElement(By.xpath('//li[@title="Workflow"]'));
        await browser.findElement(By.xpath('//li[@title="Workflow"]')).click();
        // click open in Workflows
        await waitForElement(By.xpath('//li[@title="Workflow"]//span[text()="New"]'));
        await browser.findElement(By.xpath('//li[@title="Workflow"]//span[text()="New"]')).click();

        // click Import from URL
        await waitForElement(By.xpath('//li[@title="Workflow"]//span[text()="Import from URL"]'));
        await browser.findElement(By.xpath('//li[@title="Workflow"]//span[text()="Import from URL"]')).click();

        // Paste URL for file
        await waitForElement(By.xpath('//div[@class="el-message-box__input"]//input'));
        await browser.findElement(By.xpath('//div[@class="el-message-box__input"]//input')).sendKeys(workflow_file_url);

        // click import
        await waitForElement(By.xpath('//span[contains(text(),"Import")]/parent::button'));
        await browser.findElement(By.xpath('//span[contains(text(),"Import")]/parent::button')).click();

        // click workflow name
        await waitForElement(By.xpath('//span[@class="name-container"]/span/span/span/div'));
        await browser.findElement(By.xpath('//span[@class="name-container"]/span/span/span/div')).click();

        // Clear the field
        await waitForElement(By.xpath('//span[@class="name-container"]/span/span/span/div/input'));
        await browser.findElement(By.xpath('//span[@class="name-container"]/span/span/span/div/input')).clear();
        await waitForElement(By.xpath('//span[@class="name-container"]/span/span/span/div/input'));
        await browser.findElement(By.xpath('//span[@class="name-container"]/span/span/span/div/input')).sendKeys(default_workflow_import_name);
        await waitForElement(By.xpath(saveButtonXpath));
        await browser.findElement(By.xpath(saveButtonXpath)).click();
        // Activate Workflow
        await waitForElement(By.xpath('//div[@title="Activate workflow"] | //div[@title="Activate Workflow"]'));
        await browser.findElement(By.xpath('//div[@title="Activate workflow"] | //div[@title="Activate Workflow"]')).click();

        // wait for saving
        await sleep(1000);
    }

    async function checkWorkflowData(execNumber='1') {
        await openMenu();
        console.log(`Sleeping for one minute to let the imported workflow generate some data in execution ${execNumber} . ${(new Date()).toString()}`);
        await sleep(70000);
        await waitForElement(By.xpath('//li/span[text()="Executions"]'));
        await browser.findElement(By.xpath('//li/span[text()="Executions"]')).click();
        await sleep(2000);
        // Find Name of workflow
        await browser.findElement(By.xpath(`//span[@class="workflow-name"][contains(text(), '${default_workflow_import_name}')]`));
        // Find Sucess label
        await browser.findElement(By.xpath('//span[contains(text(), "Success")]'));
        // Open first execution
        await browser.get(`https://${app.fqdn}/execution/${execNumber}`);
        await sleep(5000);
    }

    // TEST START

    xit('build app', function () { execSync('cloudron build', EXEC_ARGS); });
    it('install app', function () { execSync(`cloudron install --location ${LOCATION}`, EXEC_ARGS); });

    it('can get app information', getAppInfo);
    it('can setup', setup);
    it('can create workflow', createWorkflow);
    it('can open created workflow', openWorkflow);
    it('can import workflow from URL', importWorkflowFromUrl);
    it('check if workflow created data', checkWorkflowData);
    it('can logout', logout);

    it('can restart app', function () { execSync(`cloudron restart --app ${app.id}`, EXEC_ARGS); });
    it('can login', login);
    it('can open created workflow', openWorkflow.bind(null, default_workflow_name));
    it('can open imported workflow', openWorkflow.bind(null, default_workflow_import_name));
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
    it('can open created workflow', openWorkflow.bind(null, default_workflow_name));
    it('can open imported workflow', openWorkflow.bind(null, default_workflow_import_name));
    it('check if workflow creates data', checkWorkflowData.bind(null, '5'));
    it('can logout', logout);

    it('move to different location', async function () {
        // ensure we don't hit NXDOMAIN in the mean time
        await browser.get('about:blank');
        execSync(`cloudron configure --location ${LOCATION}2 --app ${app.id}`, EXEC_ARGS);
    });

    it('can get app information', getAppInfo);
    it('can login', login);
    it('can open created workflow', openWorkflow.bind(null, default_workflow_name));
    it('can open imported workflow', openWorkflow.bind(null, default_workflow_import_name));
    it('check if workflow creates data', checkWorkflowData.bind(null, '7'));

    it('uninstall app', async function () {
        // ensure we don't hit NXDOMAIN in the mean time
        await browser.get('about:blank');
        execSync(`cloudron uninstall --app ${app.id}`, EXEC_ARGS);
    });

    // test update
    it('can install app', function () { execSync(`cloudron install --appstore-id ${app.manifest.id} --location ${LOCATION}`, EXEC_ARGS); });
    it('can get app information', getAppInfo);
    it('can login', loginOld);
    it('can create workflow', createWorkflow);
    it('can open created workflow', openWorkflow);
    it('can import workflow from URL', importWorkflowFromUrl);
    it('check if workflow created data', checkWorkflowData);

    it('can update', function () { execSync(`cloudron update --app ${app.id}`, EXEC_ARGS); });

    it('skip setup for now', async function () {
        await browser.get(`https://${app.fqdn}`);

        await waitForElement(By.xpath('//span[contains(text()," Skip setup for now ")]'));
        await browser.findElement(By.xpath('//span[contains(text()," Skip setup for now ")]')).click();

        await waitForElement(By.xpath('//button//span[contains(text(), "Skip setup")]'));
        await browser.findElement(By.xpath('//button//span[contains(text(), "Skip setup")]')).click();

        await browser.sleep(2000);
    });
    // it('can login', login);
    it('can open created workflow', openWorkflow.bind(null, default_workflow_name));
    it('can open imported workflow', openWorkflow.bind(null, default_workflow_import_name));
    it('check if workflow creates data', checkWorkflowData.bind(null, '3'));

    it('uninstall app', async function () {
        // ensure we don't hit NXDOMAIN in the mean time
        await browser.get('about:blank');
        execSync(`cloudron uninstall --app ${app.id}`, EXEC_ARGS);
    });
});
