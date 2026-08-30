import Foundation
import Capacitor

@objc(NativeHttpPlugin)
public class NativeHttpPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeHttpPlugin"
    public let jsName = "NativeHttp"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise)
    ]

    @objc func request(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("Invalid URL")
            return
        }

        let method = call.getString("method") ?? "GET"
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 30

        if let headers = call.getObject("headers") {
            for (key, value) in headers {
                if let strValue = value as? String {
                    request.setValue(strValue, forHTTPHeaderField: key)
                }
            }
        }

        if let body = call.getString("data") {
            request.httpBody = body.data(using: .utf8)
        }

        let sessionConfig = URLSessionConfiguration.default
        sessionConfig.timeoutIntervalForRequest = 30
        let session = URLSession(configuration: sessionConfig)

        let task = session.dataTask(with: request) { data, response, error in
            if let error = error {
                call.reject("Native Network Error: \(error.localizedDescription)")
                return
            }

            guard let httpResponse = response as? HTTPURLResponse else {
                call.reject("Invalid HTTP response received")
                return
            }

            var responseHeaders: [String: String] = [:]
            for (key, value) in httpResponse.allHeaderFields {
                if let k = key as? String, let v = value as? String {
                    responseHeaders[k] = v
                }
            }

            let responseDataString = data != nil ? String(data: data!, encoding: .utf8) ?? "" : ""

            call.resolve([
                "status": httpResponse.statusCode,
                "data": responseDataString,
                "headers": responseHeaders,
                "url": httpResponse.url?.absoluteString ?? urlString
            ])
        }

        task.resume()
    }
}
