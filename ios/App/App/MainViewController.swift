import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginType(NativeHttpPlugin.self)
    }
}
