// Razorpay checkout HTML rendered in a WebView; posts result back via ReactNativeWebView.
export function buildCheckoutHtml(params: {
  keyId: string;
  orderId: string;
  amount: number;
  name: string;
  email: string;
}): string {
  return `<!doctype html>
<html>
  <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
  <body>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      // Open Razorpay immediately; relay success/failure to the app.
      var options = {
        key: '${params.keyId}',
        order_id: '${params.orderId}',
        amount: ${params.amount},
        currency: 'INR',
        name: 'Angan',
        description: 'Maintenance dues',
        prefill: { name: '${params.name}', email: '${params.email}' },
        handler: function (response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', response: response }));
        },
        modal: {
          ondismiss: function () {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dismiss' }));
          }
        }
      };
      var rzp = new Razorpay(options);
      // Relay a hard failure (declined card, etc.) so the app can react.
      rzp.on('payment.failed', function (resp) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'failed', error: resp.error }));
      });
      rzp.open();
    </script>
  </body>
</html>`;
}
