package main

import (
	"errors"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/sclevine/agouti"
	"github.com/urfave/cli"
)

const injectUserURL = "https://demo.c4dt.org"

func main() {
	app := cli.NewApp()

	app.Flags = []cli.Flag{cli.StringFlag{
		Name:     "user-data-path",
		Required: true,
	}}

	app.Commands = []cli.Command{
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
	userData, err := getUserData(c.GlobalString("user-data-path"))
	if err != nil {
		return err
	}

	if c.NArg() != 1 {
		return errors.New("no URL given")
	}
	url := c.Args().First()

	driver := agouti.ChromeDriver(agouti.ChromeOptions("args", []string{"headless"}))
	if err := driver.Start(); err != nil {
		return err
	}
	defer func() {
		errStop := driver.Stop()
		if err == nil {
			err = errStop
		}
	}()

	page, err := driver.NewPage()
	if err != nil {
		return err
	}
	// how much time until failing to find smth
	page.SetImplicitWait(60 * 1000)

	if err := injectUser(page, userData); err != nil {
		return err
	}

	if err := clicker(url, page); err != nil {
		return err
	}

	if err := page.Destroy(); err != nil {
		return err
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
		return err
	}

	storageDBInjector := `
	const dynasentDone = new Promise((resolve) =>
		window.indexedDB.open("dynasent", 10).onupgradeneeded = (event) =>
			event.target.result.
				createObjectStore("contacts", {keyPath: "key"}).
				put(JSON.parse(data)).onsuccess = resolve)

	const dbnamesDone = new Promise((resolve) =>
		window.indexedDB.open("__dbnames", 10).onupgradeneeded = (event) => {
			const store = event.target.result.
				createObjectStore("dbnames", {keyPath: "name"})
			store.createIndex("buffer", "buffer", {unique: false, multiEntry: false})
			store.put({name: "dynasent"}).onsuccess = resolve
		})

	Promise.all([dynasentDone, dbnamesDone]).then(() => {
		const elem = document.createElement("span")
		elem.id = "run-script-done"
		document.body.appendChild(elem)
	})
	`

	if err := page.RunScript(
		storageDBInjector,
		map[string]interface{}{"data": userData},
		nil); err != nil {
		return err
	}

	page.FindByID("run-script-done")

	return nil
}

func clickMatrix(matrixURL string, page *agouti.Page) error {
	if err := page.Navigate(matrixURL); err != nil {
		return err
	}
	if err := page.FindByLink("Sign In").Click(); err != nil {
		return err
	}
	if err := page.FindByClass("mx_Login_sso_link").Click(); err != nil {
		return err
	}
	if err := page.FindByButton("Login").Click(); err != nil {
		return err
	}
	if err := page.FindByLink("I trust this address").Click(); err != nil {
		return err
	}

	visible, err := page.FindByID("matrixchat").Visible()
	if err != nil {
		return err
	}
	if !visible {
		return errors.New("on matrix but weird state")
	}

	return nil
}

func clickWordpress(wordpressURL string, page *agouti.Page) error {
	if err := page.Navigate(wordpressURL); err != nil {
		return err
	}
	if err := page.FindByClass("mega-menu-toggle").Click(); err != nil {
		return err
	}
	if err := page.FindByLink("About us").Click(); err != nil {
		return err
	}
	if err := page.FindByLink("Partner Login").Click(); err != nil {
		return err
	}
	if err := page.FindByLink("Sign in with OmniLedger").Click(); err != nil {
		return err
	}

	if err := page.FindByButton("Login").Click(); err != nil {
		return err
	}

	text, err := page.FindByID("content-area").FindByClass("main_title").Text()
	if err != nil {
		return err
	}
	if text != "PARTNER LOGIN" {
		return errors.New("on wordpress but not correctly redirected")
	}

	return nil
}
