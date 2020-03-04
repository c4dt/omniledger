package cas

import (
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
)

// Logout implement cas:/logout
func (cas CAS) Logout(c *gin.Context) {
	service := c.Query("service")
	if service != "" {
		url, err := url.ParseRequestURI(service)
		if err != nil {
			c.String(http.StatusBadRequest, "invalid service param")
			return
		}

		url.RawQuery = ""
		url.Fragment = ""
		if _, ok := cas.Config.ServiceToCoinInstanceIDs[url.String()]; !ok {
			c.String(http.StatusBadRequest, "unknown service")
			return
		}

		c.Redirect(http.StatusSeeOther, service)
	} else {
		c.String(http.StatusOK, "logged out")
	}
}
