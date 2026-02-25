export const metadata = {
    title: "Terms of Service | Song Capsule",
    description: "Terms of Service for Song Capsule",
};

export default function TermsOfService() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-16 font-sans text-gray-800">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            <p className="mb-4">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

            <div className="space-y-6">
                <section>
                    <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
                    <p>By accessing or using Song Capsule ("Service", "we", "us", or "our"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you do not have permission to access the Service.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
                    <p>Song Capsule is an online platform that allows users to select a song, write a message, and lock it in a "capsule" to be opened at a future date.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">3. User Conduct</h2>
                    <p>You agree to use the Service only for lawful purposes. You must not use the Service to:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-2">
                        <li>Transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy.</li>
                        <li>Infringe on any patent, trademark, trade secret, copyright, or other proprietary rights of any party.</li>
                        <li>Transmit any material that contains software viruses or any other computer code, files, or programs designed to interrupt, destroy, or limit the functionality of any computer software or hardware.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">4. Intellectual Property</h2>
                    <p>The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Song Capsule and its licensors.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">5. Disclaimer of Warranties</h2>
                    <p>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We expressly disclaim all warranties of any kind, whether express or implied.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">6. Limitation of Liability</h2>
                    <p>In no event shall Song Capsule, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">7. Changes to Terms</h2>
                    <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3">8. Contact Us</h2>
                    <p>If you have any questions about these Terms, please contact us at support@slowjam.xyz.</p>
                </section>
            </div>
        </div>
    );
}
