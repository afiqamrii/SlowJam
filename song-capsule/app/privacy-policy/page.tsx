export const metadata = {
    title: "Privacy Policy | Song Capsule",
    description: "Privacy Policy for Song Capsule",
};

export default function PrivacyPolicy() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-16 font-sans text-gray-800">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <p className="mb-4">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

            <div className="space-y-6">
                <section>
                    <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
                    <p>Welcome to Song Capsule. This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make use of our services at slowjam-two.vercel.app.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
                    <p>We collect information you directly provide to us, such as when you create a capsule, including text, links, and dates. We also automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
                    <p>We use the information we collect to operate, maintain, and provide the features and functionality of Song Capsule. We also use it to communicate with you and monitor and analyze trends, usage, and activities in connection with our Service.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">4. Third-Party Services and Advertising (Google AdSense)</h2>
                    <p>We use third-party advertising companies to serve ads when you visit our Website. These companies may use information (not including your name, address, email address, or telephone number) about your visits to this and other websites in order to provide advertisements about goods and services of interest to you.</p>
                    <ul className="list-disc pl-6 mt-2 space-y-2">
                        <li>Third party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites.</li>
                        <li>Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visit to your sites and/or other sites on the Internet.</li>
                        <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-accent hover:underline" target="_blank" rel="noreferrer">Ads Settings</a>.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">5. Data Retention</h2>
                    <p>When you create a capsule through the Site, we will maintain your capsule Information for our records unless and until you ask us to delete this information.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">6. Changes</h2>
                    <p>We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal or regulatory reasons.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">7. Contact Us</h2>
                    <p>For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at support@slowjam.xyz.</p>
                </section>
            </div>
        </div>
    );
}
