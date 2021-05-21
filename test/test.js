#!/usr/bin/env node

/* jshint esversion: 8 */
/* global describe */
/* global before */
/* global after */
/* global it */

'use strict';

require('chromedriver');

var execSync = require('child_process').execSync,
    expect = require('expect.js'),
    path = require('path'),
    fs = require('fs'),
    { Builder, By, Key, until } = require('selenium-webdriver'),
    { Options } = require('selenium-webdriver/chrome');

describe('Application life cycle test', function () {
    this.timeout(0);

    const LOCATION = 'test';
    const TEST_TIMEOUT = 10000;
    const EXEC_ARGS = { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' };

    let browser, app, downloadLink, downloadSiteLink;

    before(function () {
        browser = new Builder().forBrowser('chrome').setChromeOptions(new Options().windowSize({ width: 1280, height: 1024 })).build();
    });

    after(function () {
        browser.quit();
    });

    async function waitForElement(elem) {
        await browser.wait(until.elementLocated(elem), TEST_TIMEOUT);
        await browser.wait(until.elementIsVisible(browser.findElement(elem)), TEST_TIMEOUT);
    }

    function sleep(millis) {
        return new Promise(resolve => setTimeout(resolve, millis));
    }

    function getAppInfo() {
        var inspect = JSON.parse(execSync('cloudron inspect'));
        app = inspect.apps.filter(function (a) { return a.location.indexOf(LOCATION) === 0; })[0];
        expect(app).to.be.an('object');
    }

    async function getMainPage() {
        await browser.get(`https://${app.fqdn}`);

        await waitForElement(By.id('upload'));
    }

    async function uploadFile() {
        await browser.get(`https://${app.fqdn}`);

        await waitForElement(By.id('upload'));

        let fileInput = await browser.findElement(By.id('file_select'));
        await fileInput.sendKeys(path.resolve(__dirname, 'test.pdf'));

        await waitForElement(By.id('send'));
        await browser.findElement(By.id('send')).click();

        await waitForElement(By.id('upload_link_text'));

        downloadSiteLink = await browser.findElement(By.id('upload_link_text')).getText();
        downloadLink = await browser.findElement(By.id('direct_link_text')).getText();

        downloadSiteLink = downloadSiteLink.replace(`https://${app.fqdn}`, '');
        downloadLink = downloadLink.replace(`https://${app.fqdn}`, '');

        console.log('Got download link', downloadSiteLink, downloadLink);
    }

    async function filePageExists() {
        await browser.get(`https://${app.fqdn}${downloadSiteLink}`);

        await waitForElement(By.id('submit_download'));
    }

    async function downloadFile() {
        execSync(`curl -L "https://${app.fqdn}${downloadLink}" -o /tmp/test.pdf`);

        var a = fs.readFileSync(path.resolve(__dirname, 'test.pdf'));
        var b = fs.readFileSync('/tmp/test.pdf');

        if(!a.equals(b)) throw('Files are not equal');
    }

    async function adminLogin() {
        await browser.get(`https://${app.fqdn}/admin.php`);

        await waitForElement(By.id('admin_password'));

        await browser.findElement(By.id('admin_password')).sendKeys('changeme123');
        await browser.findElement(By.xpath('//input[@type="submit"]')).click();

        await waitForElement(By.xpath('//input[@value="Log out"]'));
    }

    async function adminLogout() {
        await browser.get(`https://${app.fqdn}/admin.php`);

        // should logout on reload
        await waitForElement(By.id('admin_password'));
    }

    xit('build app', function () { execSync('cloudron build', EXEC_ARGS); });
    it('install app', function () { execSync(`cloudron install --location ${LOCATION}`, EXEC_ARGS); });

    it('can get app information', getAppInfo);
    it('can get main page', getMainPage);
    it('can upload file', uploadFile);
    it('file page exists', filePageExists);
    it('can download file', downloadFile);
    it('can login as admin', adminLogin);
    it('can logout as admin', adminLogout);

    it('can restart app', function () { execSync(`cloudron restart --app ${app.id}`); });

    it('file page exists', filePageExists);
    it('can download file', downloadFile);

    it('backup app', function () { execSync(`cloudron backup create --app ${app.id}`, EXEC_ARGS); });
    it('restore app', function () {
        const backups = JSON.parse(execSync(`cloudron backup list --raw --app ${app.id}`));
        execSync(`cloudron uninstall --app ${app.id}`, EXEC_ARGS);
        execSync(`cloudron install --location ${LOCATION}`, EXEC_ARGS);
        getAppInfo();
        execSync(`cloudron restore --backup ${backups[0].id} --app ${app.id}`, EXEC_ARGS);
    });

    it('file page exists', filePageExists);
    it('can download file', downloadFile);

    it('move to different location', async function () {
        // ensure we don't hit NXDOMAIN in the mean time
        await browser.get('about:blank');
        execSync(`cloudron configure --location ${LOCATION}2 --app ${app.id}`, EXEC_ARGS);
    });

    it('can get app information', getAppInfo);
    it('file page exists', filePageExists);
    it('can download file', downloadFile);
    it('can login as admin', adminLogin);
    it('can logout as admin', adminLogout);

    it('uninstall app', async function () {
        // ensure we don't hit NXDOMAIN in the mean time
        await browser.get('about:blank');
        execSync(`cloudron uninstall --app ${app.id}`, EXEC_ARGS);
    });

    // test update
    it('can install app', function () { execSync(`cloudron install --appstore-id net.jirafeau.cloudronapp --location ${LOCATION}`, EXEC_ARGS); });
    it('can get app information', getAppInfo);
    it('can get main page', getMainPage);
    it('can upload file', uploadFile);
    it('file page exists', filePageExists);
    it('can download file', downloadFile);
    it('can login as admin', adminLogin);
    it('can logout as admin', adminLogout);

    it('can update', function () { execSync(`cloudron update --app ${app.id}`, EXEC_ARGS); });

    it('can get main page', getMainPage);
    it('file page exists', filePageExists);
    it('can download file', downloadFile);
    it('can login as admin', adminLogin);
    it('can logout as admin', adminLogout);

    it('uninstall app', async function () {
        // ensure we don't hit NXDOMAIN in the mean time
        await browser.get('about:blank');
        execSync(`cloudron uninstall --app ${app.id}`, EXEC_ARGS);
    });
});
