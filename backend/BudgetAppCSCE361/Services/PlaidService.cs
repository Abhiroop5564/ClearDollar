using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Configuration;

namespace BudgetAppCSCE361.Services
{
    public class PlaidService
    {
        private readonly HttpClient _httpClient;
        private readonly string _clientId;
        private readonly string _secret;
        private readonly string _baseUrl;

        public PlaidService(IConfiguration config)
        {
            _clientId = config["Plaid:ClientId"];
            _secret = config["Plaid:Secret"];
            var env = config["Plaid:Environment"] ?? "sandbox";

            _baseUrl = env switch
            {
                "sandbox" => "https://sandbox.plaid.com",
                "development" => "https://development.plaid.com",
                "production" => "https://production.plaid.com",
                _ => "https://sandbox.plaid.com"
            };

            _httpClient = new HttpClient();
        }

        public async Task<string> GetAccessTokenAsync(string publicToken)
        {
            var payload = new
            {
                client_id = _clientId,
                secret = _secret,
                public_token = publicToken
            };

            var content = new StringContent(
                Newtonsoft.Json.JsonConvert.SerializeObject(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync($"{_baseUrl}/item/public_token/exchange", content);
            var json = await response.Content.ReadAsStringAsync();

            return JObject.Parse(json)["access_token"]?.ToString() ?? "Error getting token";
        }

        public async Task<JArray> GetTransactionsAsync(string accessToken, DateTime start, DateTime end)
        {
            var payload = new
            {
                client_id = _clientId,
                secret = _secret,
                access_token = accessToken,
                start_date = start.ToString("yyyy-MM-dd"),
                end_date = end.ToString("yyyy-MM-dd")
            };

            var content = new StringContent(
                Newtonsoft.Json.JsonConvert.SerializeObject(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync($"{_baseUrl}/transactions/get", content);
            var json = await response.Content.ReadAsStringAsync();
            return JArray.Parse(JObject.Parse(json)["transactions"]!.ToString());
        }
    }
}
