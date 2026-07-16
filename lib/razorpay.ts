// Razorpay checkout HTML: rendered inside a WebView for test-mode payments.
// The page posts the payment result back to RN via window.ReactNativeWebView.
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
      rzp.open();
    </script>
  </body>
</html>`;
}
