<%@ Page Language="C#" %>
<%@ Import Namespace="System" %>
<%@ Import Namespace="System.Web" %>
<script runat="server">
  protected void Page_Load(object sender, EventArgs e)
  {
    Response.ContentType = "application/json";
    Response.Headers["Cache-Control"] = "no-store";

    try
    {
      var identity = Request.LogonUserIdentity;
      if (identity == null || !identity.IsAuthenticated)
      {
        Response.StatusCode = 401;
        Response.Write("{\"message\":\"Authentication required. Configure IIS Basic or Windows authentication for /api/login.aspx.\"}");
        return;
      }

      string username = identity.Name ?? string.Empty;
      string displayName = username.Contains("\\") ? username.Substring(username.IndexOf('\\') + 1) : username;
      string email = string.Concat(displayName.Replace(" ", string.Empty), "@company.local");

      Response.Headers["X-IIS-User"] = username;
      Response.Write(string.Format(
        "{{\"user\":{{\"id\":\"{0}\",\"username\":\"{0}\",\"displayName\":\"{1}\",\"email\":\"{2}\",\"role\":\"User\",\"authType\":\"server\",\"isAuthenticated\":true}}}}",
        HttpUtility.JavaScriptStringEncode(username),
        HttpUtility.JavaScriptStringEncode(displayName),
        HttpUtility.JavaScriptStringEncode(email)
      ));
    }
    catch (Exception ex)
    {
      Response.StatusCode = 500;
      Response.Write(string.Format(
        "{{\"message\":\"Server authentication endpoint failed.\",\"detail\":\"{0}\"}}",
        HttpUtility.JavaScriptStringEncode(ex.Message)
      ));
    }
  }
</script>