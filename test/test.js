#!/usr/bin/env node

/* jshint esversion: 8 */
/* global describe */
/* global before */
/* global after */
/* global it */
/* global xit */

'use strict';

require('chromedriver');

var execSync = require('child_process').execSync,
    expect = require('expect.js'),
    path = require('path'),
    { Builder, By, Key, until } = require('selenium-webdriver'),
    { Options } = require('selenium-webdriver/chrome');

describe('Application life cycle test', function () {
    this.timeout(0);

    const LOCATION = 'test';
    const TEST_TIMEOUT = 10000;
    const EXEC_ARGS = { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' };
    const username = process.env.USERNAME;
    const password = process.env.PASSWORD;
    const workflow_file_url = 'https://git.cloudron.io/cloudron/n8n-app/-/raw/update/testing/test/Cloudron_Test_Workflow.json';
    const default_workflow_name = 'Cloudron Test Workflow';
    const default_workflow_import_name = 'Cloudron Imported Workflow';

    let browser, app;

    before(function (done) {
        if (!process.env.PASSWORD) return done(new Error('PASSWORD env var not set'));
        if (!process.env.USERNAME) return done(new Error('USERNAME env var not set'));

        browser = new Builder().forBrowser('chrome').setChromeOptions(new Options().windowSize({ width: 1280, height: 1024 })).build();
        done();
    });

    after(function () {
        browser.quit();
    });

    function sleep(millis) {
        return new Promise(resolve => setTimeout(resolve, millis));
    }

    async function waitForElement(elem) {
        await browser.wait(until.elementLocated(elem), TEST_TIMEOUT);
        await browser.wait(until.elementIsVisible(browser.findElement(elem)), TEST_TIMEOUT);
    }

    function getAppInfo() {
        var inspect = JSON.parse(execSync('cloudron inspect'));
        app = inspect.apps.filter(function (a) { return a.location.indexOf(LOCATION) === 0; })[0];
        expect(app).to.be.an('object');
    }

    async function login() {
        await browser.get(`https://${app.fqdn}/login`);

        await waitForElement(By.id('inputUsername'));

        await browser.findElement(By.id('inputUsername')).sendKeys(username);
        await browser.findElement(By.id('inputPassword')).sendKeys(password);
        await browser.findElement(By.id('login')).click();

        await sleep(2000);

        await waitForElement(By.xpath(`/html/body/div[1]/div[1]/div/div/div/div/span[1]/span/span/span/div`));
    }

    const saveButtonXpath = '//li[@title="Workflow"]//span[text()="Save"]';
    const addNodeButtonXpath = '/html/body/div[1]/div[3]/div/div[3]/button';
    // the `placeholder` in the input field might change in a future update look out for that
    const nodeSearchFieldXpath = '//div/input[@placeholder="Search nodes..."]';
    const nodeCloseButtonXpath = '/html/body/div[1]/div[3]/div/div[2]/div/div[3]';

    async function openMenu() {
        await browser.get(`https://${app.fqdn}/`);
        await browser.findElement(By.xpath('//*[@id="collapse-change-button"]')).click();
        await sleep(1000);
    }

    async function createWorkflow() {
        await openMenu();
        // click Workflows in menu
        await browser.findElement(By.xpath('//li[@title="Workflow"]')).click();
        await sleep(1000);
        // click New in Workflows
        await browser.findElement(By.xpath('//li[@title="Workflow"]//span[text()="New"]')).click();
        await sleep(500);
        // click workflow name
        await browser.findElement(By.xpath('//span[@class="name-container"]')).click();
        await sleep(500);
        // Clear the field
        await browser.findElement(By.xpath('//span[@class="name-container"]//input')).clear();
        await sleep(500);
        await browser.findElement(By.xpath('//span[@class="name-container"]//input')).sendKeys('Cloudron Test Workflow');
        // Click save button
        await browser.findElement(By.xpath(saveButtonXpath)).click();
        // Add CoinGecko Node
        await browser.findElement(By.xpath(addNodeButtonXpath)).click();
        await sleep(500);
        await browser.findElement(By.xpath(nodeSearchFieldXpath)).sendKeys("CoinGecko");
        // Click CoinGecko Node
        await browser.findElement(By.xpath('//div/div/span[text()="CoinGecko"]')).click();
        await sleep(1000);
        // Close node config window
        await browser.findElement(By.xpath(nodeCloseButtonXpath)).click();
        await sleep(1000);
        // Part missing to connect the nodes to create a functional workflow
        // save anyway
        await browser.findElement(By.xpath(saveButtonXpath)).click();
        await sleep(1000);
    }

    async function openWorkflow(workflowname=default_workflow_name) {
        await openMenu();
        // click Workflows in menu
        await browser.findElement(By.xpath('//li[@title="Workflow"]')).click();
        await sleep(1000);
        // click open in Workflows
        await browser.findElement(By.xpath('//li[@title="Workflow"]//span[text()="Open"]')).click();
        await sleep(500);
        // Find element with text "Cloudron Test Workflow" and click it.
        await browser.findElement(By.xpath(`//tr//td//span[contains(text(), '${workflowname}')]`)).click();
        await sleep(500);
        await waitForElement(By.xpath(`//span[@title="${workflowname}"]`));
        await sleep(500);
    }

    async function importWorkflowFromUrl() {
        await openMenu();
        // click Workflows in menu
        await browser.findElement(By.xpath('//li[@title="Workflow"]')).click();
        await sleep(1000);
        // click Import from URL
        await browser.findElement(By.xpath('//li[@title="Workflow"]//span[text()="Import from URL"]')).click();
        await sleep(2000);
        // Paste URL for file
        await browser.findElement(By.xpath('//div[@aria-label="Import Workflow from URL:"]//input')).sendKeys(workflow_file_url);
        await sleep(1000);
        // click import
        await browser.findElement(By.xpath('//div[@aria-label="Import Workflow from URL:"]//button/span[contains(text(), "Import")]')).click();
        await sleep(2000);
        // click workflow name
        await browser.findElement(By.xpath('//span[@class="name-container"]/span/span/span/div')).click();
        await sleep(1000);
        // Clear the field
        await browser.findElement(By.xpath('//span[@class="name-container"]/span/span/span/div/input')).clear();
        await sleep(1000);
        await browser.findElement(By.xpath('//span[@class="name-container"]/span/span/span/div/input')).sendKeys(default_workflow_import_name);
        await browser.findElement(By.xpath(saveButtonXpath)).click();
        await sleep(1000);
        // Activate Workflow
        await browser.findElement(By.xpath('//div[@title="Activate Workflow"]')).click();
        await sleep(2000);
        // click dialog to activate and save
        await browser.findElement(By.xpath('//button/span[contains(text(), "Yes, activate and save!")]')).click();
        await sleep(1000);
    }

    async function checkWorkflowData(execNumber='1') {
        await openMenu();
        // Sleep for one minute to let the imported workflow generate some data 
        await sleep(60000);
        await browser.findElement(By.xpath('//li/span[text()="Executions"]')).click();
        await sleep(1000);
        // Find Name of workflow
        await browser.findElement(By.xpath(`//*[contains(text(), '${default_workflow_import_name}')]`));
        // Find Sucess label
        await browser.findElement(By.xpath("//*[contains(text(), 'Success')]"));
        // Open first execution
        await browser.get(`https://${app.fqdn}/execution/${execNumber}`);
        await sleep(1000);
        // Find data notification symbol
        await browser.findElement(By.xpath('/html/body/div/div[3]/div/div[1]/div[2]/div[2]/div[1]/div[1]'));
        await sleep(1000);
    }

    // TEST START

    xit('build app', function () { execSync('cloudron build', EXEC_ARGS); });
    xit('install app', function () { execSync(`cloudron install --location ${LOCATION}`, EXEC_ARGS); });

    it('can get app information', getAppInfo);
    it('can login', login);
    it('can create workflow', createWorkflow);
    it('can open created workflow', openWorkflow);
    it('can import workflow from URL', importWorkflowFromUrl);
    it('check if workflow created data', checkWorkflowData);

    it('can restart app', function () { execSync(`cloudron restart --app ${app.id}`, EXEC_ARGS); });
    it('can login', login);
    it('can open created workflow', openWorkflow.bind(null, default_workflow_name));
    it('can open imported workflow', openWorkflow.bind(null, default_workflow_import_name));
    it('check if workflow creates data', checkWorkflowData.bind(null, '2'));

    it('backup app', function () { execSync(`cloudron backup create --app ${app.id}`, EXEC_ARGS); });
    it('restore app', function () {
        const backups = JSON.parse(execSync(`cloudron backup list --raw --app ${app.id}`));
        execSync(`cloudron uninstall --app ${app.id}`, EXEC_ARGS);
        execSync(`cloudron install --location ${LOCATION}`, EXEC_ARGS);
        getAppInfo();
        execSync(`cloudron restore --backup ${backups[0].id} --app ${app.id}`, EXEC_ARGS);
    });

    it('can restart app', function () { execSync(`cloudron restart --app ${app.id}`, EXEC_ARGS); });
    it('can login', login);
    it('can open created workflow', openWorkflow.bind(null, default_workflow_name));
    it('can open imported workflow', openWorkflow.bind(null, default_workflow_import_name));
    it('check if workflow creates data', checkWorkflowData.bind(null, '3'));

    it('move to different location', async function () {
        // ensure we don't hit NXDOMAIN in the mean time
        await browser.get('about:blank');
        execSync(`cloudron configure --location ${LOCATION}2 --app ${app.id}`, EXEC_ARGS);
    });

    it('can get app information', getAppInfo);
    it('can login', login);
    it('can restart app', function () { execSync(`cloudron restart --app ${app.id}`, EXEC_ARGS); });
    it('can login', login);
    it('can open created workflow', openWorkflow.bind(null, default_workflow_name));
    it('can open imported workflow', openWorkflow.bind(null, default_workflow_import_name));
    it('check if workflow creates data', checkWorkflowData.bind(null, '4'));

    it('uninstall app', async function () {
        // ensure we don't hit NXDOMAIN in the mean time
        await browser.get('about:blank');
        execSync(`cloudron uninstall --app ${app.id}`, EXEC_ARGS);
    });

    // test update
    it('can install app', function () { execSync(`cloudron install --appstore-id ${app.manifest.id} --location ${LOCATION}`, EXEC_ARGS); });
    it('can get app information', getAppInfo);
    it('can login', login);
    it('can create workflow', createWorkflow);
    it('can open created workflow', openWorkflow);
    it('can import workflow from URL', importWorkflowFromUrl);
    it('check if workflow created data', checkWorkflowData);

    it('can update', function () { execSync(`cloudron update --app ${app.id}`, EXEC_ARGS); });

    it('can login', login);
    it('can restart app', function () { execSync(`cloudron restart --app ${app.id}`, EXEC_ARGS); });

    it('can login', login);
    it('can open created workflow', openWorkflow.bind(null, default_workflow_name));
    it('can open imported workflow', openWorkflow.bind(null, default_workflow_import_name));
    it('check if workflow creates data', checkWorkflowData.bind(null, '2'));

    it('uninstall app', async function () {
        // ensure we don't hit NXDOMAIN in the mean time
        await browser.get('about:blank');
        execSync(`cloudron uninstall --app ${app.id}`, EXEC_ARGS);
    });
});
