import Link from "next/link";
export default function AccountNotFound() { return <div className="page-shell account-page"><h1>Order unavailable</h1><p>This order or paid receipt isn’t available in your account.</p><Link className="button" href="/account">Back to my orders</Link></div>; }
