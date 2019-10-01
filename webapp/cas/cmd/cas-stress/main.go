package main

import (
	"errors"
	"io/ioutil"
	"math/rand"
	"os"
	"time"

	"github.com/sclevine/agouti"
	"github.com/urfave/cli"
)

const omniledgerURL = "https://demo.c4dt.org/omniledger"

func main() {
	app := cli.NewApp()

	app.Flags = []cli.Flag{
		cli.StringFlag{Name: "with-wordpress-url"},
		cli.StringFlag{Name: "with-matrix-url"},
		cli.StringFlag{
			Name:     "user-data-path",
			Required: true,
		},
		cli.DurationFlag{
			Name:  "new-login-delay",
			Value: time.Minute,
		},
	}
	app.Action = func(c *cli.Context) error {
		userData, err := getUserData(c.String("user-data-path"))
		if err != nil {
			return err
		}

		driver := agouti.ChromeDriver(agouti.ChromeOptions("args", []string{"headless"}))
		if err := driver.Start(); err != nil {
			return err
		}

		clickers := make([]func(*agouti.Page) error, 0)
		if url := c.String("with-matrix-url"); url != "" {
			clickers = append(clickers, func(p *agouti.Page) error { return clickMatrix(url, p) })
		}
		if url := c.String("with-wordpress-url"); url != "" {
			clickers = append(clickers, func(p *agouti.Page) error { return clickWordpress(url, p) })
		}

		ticker := time.Tick(c.Duration("new-login-delay"))
		for {
			page, err := getNewPage(driver, userData)
			if err != nil {
				return err
			}

			i := rand.Intn(len(clickers))
			clicker := clickers[i]

			err = clicker(page)
			if err != nil {
				return err
			}

			if err := page.Destroy(); err != nil {
				return err
			}

			<-ticker
		}
	}

	err := app.Run(os.Args)
	if err != nil {
		panic(err)
	}
}

func getUserData(path string) (string, error) {
	raw, err := ioutil.ReadFile(path)
	if err != nil {
		return "", err
	}

	return string(raw), nil
}

func injectUser(page *agouti.Page, userData string) error {
	if err := page.Navigate(omniledgerURL); err != nil {
		return err
	}

	storageDBInjector := `
	var request = window.indexedDB.open("dynasent", 10);
	request.onerror = console.log;
	request.onupgradeneeded = function(event) {
		event.target.result.
			createObjectStore("contacts", {keyPath: "key"}).
			put(JSON.parse(data));
	};

	var request = window.indexedDB.open("__dbnames", 10);
	request.onerror = console.log;
	request.onupgradeneeded = function(event) {
		const store = event.target.result.
			createObjectStore("dbnames", {keyPath: "name"});
		store.createIndex("buffer", "buffer", {unique: false, multiEntry: false});
		store.put({name: "dynasent"});
	};`

	if err := page.RunScript(
		storageDBInjector,
		map[string]interface{}{"data": userData},
		nil); err != nil {
		return err
	}

	// TODO eww, how to wait for javascript async then?
	time.Sleep(10 * time.Second)

	return nil
}

func clickMatrix(matrixURL string, page *agouti.Page) error {
	if err := page.Navigate(matrixURL); err != nil {
		return err
	}
	if err := page.FindByLink("Sign In").Click(); err != nil {
		return err
	}
	if err := page.FindByLink("Sign in with single sign-on").Click(); err != nil {
		return err
	}
	if err := page.FindByButton("Login").Click(); err != nil {
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
	if err := page.FindByLink("Members only").Click(); err != nil {
		return err
	}
	if err := page.FindByLink("Sign in with OmniLedger").Click(); err != nil {
		return err
	}
	if err := page.FindByButton("Login").Click(); err != nil {
		return err
	}

	visible, err := page.Find("article").Visible()
	if err != nil {
		return err
	}
	if !visible {
		return errors.New("on wordpress but weird state")
	}

	return nil
}

func getNewPage(driver *agouti.WebDriver, userData string) (*agouti.Page, error) {
	page, err := driver.NewPage()
	if err != nil {
		return nil, err
	}

	// how much time until failing to find smth
	page.SetImplicitWait(60 * 1000)

	err = injectUser(page, userData)
	if err != nil {
		return nil, err
	}

	return page, nil
}
