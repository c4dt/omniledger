package main

import (
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"github.com/c4dt/omniledger/webapp/cas"
)

func getRouter(cas cas.CAS) *gin.Engine {
	const baseURL = "http://localhost:4200"

	redirectWithPath := func(getPath func(*gin.Context) string) func(*gin.Context) {
		return func(c *gin.Context) {
			resp, err := http.Get(baseURL + getPath(c))
			if err != nil {
				c.Error(err)
				c.Abort()
			}
			defer resp.Body.Close()

			c.DataFromReader(
				resp.StatusCode,
				resp.ContentLength,
				resp.Header.Get("Content-Type"),
				resp.Body,
				map[string]string{},
			)
		}
	}
	redirectToRoot := redirectWithPath(func(*gin.Context) string { return "/" })
	redirect := redirectWithPath(func(c *gin.Context) string { return c.Request.URL.String() })

	r := gin.Default()

	r.GET("/api/v0/cas/p3/serviceValidate", func(c *gin.Context) {
		c.XML(http.StatusOK, cas.ServiceValidateXML(
			c.Query("service"), c.Query("ticket"),
		))
	})

	// TODO fix synapse to support CAS 3.0, should be $cas/p3/proxyValidate
	r.GET("/api/v0/cas/proxyValidate", func(c *gin.Context) {
		c.XML(http.StatusOK, cas.ProxyValidateXML(
			c.Query("service"), c.Query("ticket"),
		))
	})

	r.GET("/", redirectToRoot)
	r.GET("/register/*path", redirectToRoot)
	r.GET("/admin/*path", redirectToRoot)
	r.GET("/user/*path", redirectToRoot)
	r.GET("/newuser/*path", redirectToRoot)
	r.GET("/c4dt/*path", redirectToRoot)
	r.GET("/api/v0/cas/login", redirectToRoot)

	r.GET("/assets/*path", redirect)
	r.GET("/favicon.ico", redirect)
	r.GET("/main.js", redirect)
	r.GET("/polyfills.js", redirect)
	r.GET("/runtime.js", redirect)
	r.GET("/styles.js", redirect)
	r.GET("/vendor.js", redirect)

	return r
}

func getCASFromOsArgs() cas.CAS {
	if len(os.Args) != 2 {
		log.Fatalf("usage: %s config.toml", os.Args[0])
	}
	toml, err := ioutil.ReadFile(os.Args[1])
	if err != nil {
		log.Fatal(err)
	}

	conf, err := cas.ParseConfig(toml)
	if err != nil {
		log.Fatal(err)
	}

	return cas.NewCAS(*conf)
}

func main() {
	cas := getCASFromOsArgs()
	r := getRouter(cas)
	r.Run(":4201")
}
