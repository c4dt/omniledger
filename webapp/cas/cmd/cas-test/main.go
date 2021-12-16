package main

import (
	"errors"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/sclevine/agouti"
	cli "github.com/urfave/cli/v2"
)

const injectUserURL = "https://login.c4dt.org"

func main() {
	app := cli.NewApp()

	app.Flags = []cli.Flag{&cli.StringFlag{
		Name:     "user-data-path",
		Required: true,
	}}

	app.Commands = []*cli.Command{
		{
			Name: "wordpress",
			Action: func(c *cli.Context) error {
				return runClicker(c, clickWordpress)
			},
		}, {
			Name: "matrix",
			Action: func(c *cli.Context) error {
				return runClicker(c, clickMatrix)
			},
		},
	}

	err := app.Run(os.Args)
	if err != nil {
		fmt.Println("error:", err)
		os.Exit(1)
	}
}

func runClicker(c *cli.Context, clicker func(string, *agouti.Page) error) (err error) {
	userData, err := getUserData(c.String("user-data-path"))
	if err != nil {
		return fmt.Errorf("get user data: %v", err)
	}

	if c.NArg() != 1 {
		return errors.New("no URL given")
	}
	url := c.Args().First()

	driver := agouti.ChromeDriver(agouti.ChromeOptions("args", []string{"headless", "disable-gpu"}))
	if err := driver.Start(); err != nil {
		return fmt.Errorf("driver start: %v", err)
	}
	defer func() {
		errStop := driver.Stop()
		if err == nil && errStop != nil {
			err = fmt.Errorf("driver stop: %v", errStop)
		}
	}()

	page, err := driver.NewPage()
	if err != nil {
		return fmt.Errorf("get new page: %v", err)
	}
	// how much time until failing to find smth
	page.SetImplicitWait(60 * 1000)

	if err := injectUser(page, userData); err != nil {
		return fmt.Errorf("inject user: %v", err)
	}

	if err := clicker(url, page); err != nil {
		return fmt.Errorf("simulate user: %v", err)
	}

	if err := page.Destroy(); err != nil {
		return fmt.Errorf("destroy page: %v", err)
	}

	return nil
}

func getUserData(path string) (string, error) {
	raw, err := ioutil.ReadFile(path)
	if err != nil {
		return "", err
	}

	return string(raw), nil
}

func injectUser(page *agouti.Page, userData string) error {
	if err := page.Navigate(injectUserURL); err != nil {
		return fmt.Errorf("navigate to user injection page: %v", err)
	}

	storageDBInjector := `
	const dynasentDone = new Promise((resolve, reject) => {
		const request = window.indexedDB.open("dynasent2", 10)
		request.onupgradeneeded = (event) => {
			const store = event.target.result.
				createObjectStore("contacts", {keyPath: "key"})
			Array.from(JSON.parse(data)).
				forEach(e => store.put(e))
		}
		request.onsuccess = resolve
		request.onerror = () => reject(request.error)
	})

	const dbnamesDone = new Promise((resolve, reject) => {
		const objectStoreName = "dbnames"
		const request = window.indexedDB.open("__dbnames", 10)
		request.onupgradeneeded = (event) =>
			event.target.result.
				createObjectStore(objectStoreName, {keyPath: "name"}).
				createIndex("buffer", "buffer", {unique: false, multiEntry: false})
		request.onsuccess = (event) =>
			event.target.result.transaction(objectStoreName, "readwrite").
				objectStore(objectStoreName).
				put({name: "dynasent2"}).
				onsuccess = resolve
		request.onerror = () => reject(request.error)
	})

	const elem = document.createElement("span")
	elem.id = "run-script-done"
	Promise.all([dynasentDone, dbnamesDone])
		.catch((e) => { elem.textContent = e.name + ": " + e.message })
		.finally(() => document.body.appendChild(elem))
	`

	if err := page.RunScript(
		storageDBInjector,
		map[string]interface{}{"data": userData},
		nil); err != nil {
		return fmt.Errorf("run script: %v", err)
	}

	scriptErr, err := page.FindByID("run-script-done").Text()
	if err != nil {
		return fmt.Errorf("get script's end marker: %v", err)
	}
	if scriptErr != "" {
		return fmt.Errorf("script failed: %v", scriptErr)
	}

	return nil
}

func clickMatrix(matrixURL string, page *agouti.Page) error {
	if err := page.Navigate(matrixURL); err != nil {
		return fmt.Errorf("navigate to %v: %v", matrixURL, err)
	}
	if err := page.FindByLink("Sign In").Click(); err != nil {
		return fmt.Errorf("matrix home: %v", err)
	}
	if err := page.FindByClass("mx_SSOButton").Click(); err != nil {
		return fmt.Errorf("matrix SSO login: %v", err)
	}

	if err := page.FindByButton("Login").Click(); err != nil {
		return fmt.Errorf("omniledger login: %v", err)
	}

	visible, err := page.FindByID("matrixchat").Visible()
	if err != nil {
		return fmt.Errorf("matrix chat: %v", err)
	}
	if !visible {
		return errors.New("on matrix but weird state")
	}

	return nil
}

func clickWordpress(wordpressURL string, page *agouti.Page) error {
	if err := page.Navigate(wordpressURL); err != nil {
		return fmt.Errorf("navigate to %v: %v", wordpressURL, err)
	}
	if err := page.FindByClass("mega-menu-toggle").Click(); err != nil {
		return fmt.Errorf("wordpress menu click: %v", err)
	}
	if err := page.FindByLink("About us").Click(); err != nil {
		return fmt.Errorf("wordpress menu category click: %v", err)
	}
	if err := page.FindByLink("Partner Login").Click(); err != nil {
		return fmt.Errorf("wordpress menu item click: %v", err)
	}
	if err := page.FindByLink("Sign in with OmniLedger").Click(); err != nil {
		return fmt.Errorf("wordpress login form: %v", err)
	}

	if err := page.FindByButton("Login").Click(); err != nil {
		return fmt.Errorf("omniledger login: %v", err)
	}

	text, err := page.FindByID("content-area").FindByClass("main_title").Text()
	if err != nil {
		return fmt.Errorf("wordpress partners page: %v", err)
	}
	if text != "PARTNER LOGIN" {
		return errors.New("on wordpress but not correctly redirected")
	}

	return nil
}
