package main

import (
	"fmt"
	"io/ioutil"
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
	r.GET("/api/v0/cas/logout", cas.Logout)

	// TODO fix synapse and apache/auth_cas to support CAS 3.0
	r.GET("/api/v0/cas/proxyValidate", func(c *gin.Context) {
		c.XML(http.StatusOK, cas.ProxyValidateXML(
			c.Query("service"), c.Query("ticket"),
		))
	})
	r.GET("/api/v0/cas/serviceValidate", func(c *gin.Context) {
		c.XML(http.StatusOK, cas.ServiceValidateXML(
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

func parseOsArgs() (*cas.CAS, string, error) {
	if len(os.Args) != 3 {
		return nil, "", fmt.Errorf("usage: %s config.toml bind-addr", os.Args[0])
	}
	toml, err := ioutil.ReadFile(os.Args[1])
	if err != nil {
		return nil, "", err
	}

	conf, err := cas.ParseConfig(toml)
	if err != nil {
		return nil, "", err
	}

	cas := cas.NewCAS(*conf)
	return &cas, os.Args[2], nil
}

func main() {
	cas, addr, err := parseOsArgs()
	if err != nil {
		panic(err)
	}

	getRouter(*cas).Run(addr)
}
