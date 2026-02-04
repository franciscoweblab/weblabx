export default {
	async fetch(request) {
		const allowedOrigins = ['https://weblabx.com', 'https://www.weblabx.com'];

		const origin = request.headers.get('Origin');

		if (origin && origin !== allowedOrigin) {
			return new Response('Forbidden', { status: 403 });
		}

		const url = new URL(request.url);
		const domain = url.searchParams.get('domain');

		// validação básica
		if (!domain) {
			return Response.json({ error: 'Missing domain' }, { status: 400 });
		}

		if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
			return Response.json({ error: 'Invalid domain' }, { status: 400 });
		}

		try {
			const mxRecords = await resolveDNS(domain, 'MX');
			const spfRecords = await resolveDNS(domain, 'TXT');
			const dmarcRecords = await resolveDNS(`_dmarc.${domain}`, 'TXT');

			const result = {
				mx: mxRecords.length > 0,
				spf: spfRecords.some((r) => r.includes('v=spf1')),
				dmarc: dmarcRecords.some((r) => r.includes('v=DMARC1')),
			};

			result.score = (result.mx ? 40 : 0) + (result.spf ? 30 : 0) + (result.dmarc ? 30 : 0);

			result.status = result.score >= 80 ? 'Strong' : result.score >= 50 ? 'Needs Attention' : 'At Risk';

			return Response.json(result);
		} catch (err) {
			return Response.json({ error: 'Failed to check domain' }, { status: 500 });
		}
	},
};

// helper DNS
async function resolveDNS(domain, type) {
	const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=${type}`, {
		headers: {
			accept: 'application/dns-json',
		},
	});

	const data = await response.json();

	return data.Answer?.map((a) => a.data) || [];
}
