// GhostRush MC Carrier Scraper Edge Function

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Browser-like headers to avoid bot detection
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'max-age=0',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
};

// Clean text helper - exactly like Python
function clean(text: string | null | undefined): string {
  if (text) return text.replace(/\s+/g, ' ').trim();
  return 'N/A';
}

// Get email from SMS page - matching Python logic
async function getEmailFromSms(usdot: string): Promise<string> {
  if (!usdot || usdot === 'N/A') return 'N/A';
  
  const smsUrl = `https://ai.fmcsa.dot.gov/SMS/Carrier/${usdot}/CarrierRegistration.aspx`;
  
  try {
    const resp = await fetch(smsUrl, {
      headers: BROWSER_HEADERS,
    });
    
    const html = await resp.text();
    const emailMatch = html.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      return emailMatch[0];
    }
  } catch (error) {
    console.error(`Error fetching email for USDOT ${usdot}:`, error);
  }
  
  return 'N/A';
}

// Scrape a single MC number - using POST like the Python script
// IMPORTANT: All variables are declared fresh inside this function
async function scrapeSingleMc(mcNum: number): Promise<{
  mcNumber: number;
  usdot: string;
  phone: string;
  email: string;
  status: string;
} | null> {
  // Initialize ALL result variables at the START of each call
  let phone: string = 'N/A';
  let usdot: string = 'N/A';
  let email: string = 'N/A';
  let status: string = 'N/A';
  
  const saferUrl = 'https://safer.fmcsa.dot.gov/query.asp';
  
  // Use POST with form data - this is how FMCSA expects the request
  const formData = new URLSearchParams({
    searchtype: 'ANY',
    query_type: 'queryCarrierSnapshot',
    query_param: 'MC_MX',
    query_string: String(mcNum),
  });
  
  try {
    const resp = await fetch(saferUrl, {
      method: 'POST',
      headers: {
        ...BROWSER_HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://safer.fmcsa.dot.gov',
        'Referer': 'https://safer.fmcsa.dot.gov/',
      },
      body: formData.toString(),
    });
    
    const html = await resp.text();
    
    console.log(`MC ${mcNum}: HTML length = ${html.length}`);
    
    // If HTML is too small, we got blocked or no results
    if (html.length < 1000) {
      console.log(`MC ${mcNum}: Response too small, likely blocked or no data`);
      return null;
    }
    
    // Check for OPERATING AUTHORITY INFORMATION section (case insensitive)
    const htmlLower = html.toLowerCase();
    if (!htmlLower.includes('operating authority information')) {
      console.log(`MC ${mcNum}: No operating authority section found`);
      return null;
    }
    
    // Extract the operating authority section
    const sectionStart = htmlLower.indexOf('operating authority information');
    const sectionHtml = html.substring(sectionStart, sectionStart + 5000);
    
    // Multiple patterns to find status
    const statusPatterns = [
      /Operating Authority Status[^<]*<\/(?:td|th|center)>\s*<td[^>]*>\s*(?:<[^>]+>)*\s*([^<]+)/i,
      /Operating Authority Status[^<]*<\/(?:td|th)>\s*<td[^>]*>([^<]+)/i,
      /Authority Status[^<]*<\/(?:td|th)>\s*<td[^>]*>\s*(?:<[^>]+>)*\s*([^<]+)/i,
      /class="[^"]*"[^>]*>\s*([^<]*AUTHORIZED[^<]*)</i,
      />(AUTHORIZED -[^<]+)</i,
      />([^<]*AUTHORIZED[^<]*)</i,
    ];
    
    for (const pattern of statusPatterns) {
      const match = sectionHtml.match(pattern);
      if (match && match[1]) {
        const val = clean(match[1]).toUpperCase();
        if (val.length > 0 && val !== 'N/A' && (val.includes('AUTHORIZED') || val.includes('NONE') || val.includes('ACTIVE'))) {
          status = val;
          console.log(`MC ${mcNum}: Found status = "${status}"`);
          break;
        }
      }
    }
    
    if (status === 'N/A') {
      console.log(`MC ${mcNum}: Could not extract status from section`);
      return null;
    }
    
    // STRICT FILTER - exactly matching Python logic
    if (status.includes('NOT AUTHORIZED')) {
      console.log(`MC ${mcNum}: NOT AUTHORIZED - skipping`);
      return null;
    }
    if (status === 'NONE' || (status.includes('NONE') && !status.includes('AUTHORIZED'))) {
      console.log(`MC ${mcNum}: NONE - skipping`);
      return null;
    }
    if (!status.includes('AUTHORIZED')) {
      console.log(`MC ${mcNum}: Status doesn't contain AUTHORIZED: "${status}"`);
      return null;
    }
    
    // Extract Phone number - matching Python logic
    // The HTML has nested tags like <center><b>Phone</b></center> so we need flexible patterns
    // Pattern: find "Phone" text (with possible tags around it), then find the next <td> content
    const phonePatterns = [
      // Pattern 1: Phone label with nested tags, followed by td with nested content
      /<t[dh][^>]*>(?:<[^>]+>)*\s*Phone\s*(?:<\/[^>]+>)*<\/t[dh]>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
      // Pattern 2: Simple Phone followed by td
      />Phone<\/[^>]+>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
      // Pattern 3: Phone: with colon
      /<t[dh][^>]*>(?:<[^>]+>)*\s*Phone:\s*(?:<\/[^>]+>)*<\/t[dh]>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
    ];
    
    for (const pattern of phonePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        // Strip any remaining HTML tags and entities from the captured content
        const stripped = match[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, '').replace(/&amp;/gi, '&');
        const val = clean(stripped);
        if (val && val !== 'N/A' && val.length >= 7 && /\d/.test(val)) {
          phone = val;
          console.log(`MC ${mcNum}: Found phone = "${phone}"`);
          break;
        }
      }
    }
    
    // Extract USDOT number from the full HTML - FRESH extraction
    const usdotPatterns = [
      /USDOT Number[^<]*<\/(?:td|th)>\s*<td[^>]*>\s*(?:<[^>]+>)*\s*(\d+)/i,
      /USDOT Number[^<]*<\/(?:td|th)>\s*<td[^>]*>(\d+)/i,
      /USDOT[^<]*<\/(?:td|th)>\s*<td[^>]*>\s*(?:<[^>]+>)*\s*(\d+)/i,
      /USDOT[^\d]*(\d{5,})/i,
    ];
    
    for (const pattern of usdotPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const val = clean(match[1]);
        if (val && /^\d+$/.test(val) && val.length >= 5) {
          usdot = val;
          console.log(`MC ${mcNum}: Found USDOT = "${usdot}"`);
          break;
        }
      }
    }
    
    // Get email from SMS page - using the freshly extracted USDOT
    email = await getEmailFromSms(usdot);
    
    console.log(`MC ${mcNum}: AUTHORIZED 👻 | USDOT: ${usdot} | Phone: ${phone} | Email: ${email}`);
    
    // Return a completely new object with no references
    return {
      mcNumber: mcNum,
      usdot: usdot,
      phone: phone,
      email: email,
      status: status,
    };
  } catch (error) {
    console.error(`Error scraping MC ${mcNum}:`, error);
    return null;
  }
}

// Process a batch of MCs concurrently
async function processBatch(mcNumbers: number[]): Promise<Array<{
  mcNumber: number;
  usdot: string;
  phone: string;
  email: string;
  status: string;
}>> {
  const promises = mcNumbers.map(mc => scrapeSingleMc(mc));
  const results = await Promise.all(promises);
  
  // Filter out nulls and return valid results
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { mcNumber, startMc, endMc, batchMcs } = await req.json();
    
    // Single MC number scrape
    if (mcNumber !== undefined) {
      const result = await scrapeSingleMc(mcNumber);
      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Batch scrape (for concurrent processing from frontend)
    if (batchMcs !== undefined && Array.isArray(batchMcs)) {
      const results = await processBatch(batchMcs);
      return new Response(
        JSON.stringify({ success: true, data: results, total: batchMcs.length, found: results.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Range scrape (legacy - kept for backward compatibility)
    if (startMc !== undefined && endMc !== undefined) {
      if (typeof startMc !== 'number' || typeof endMc !== 'number') {
        return new Response(
          JSON.stringify({ success: false, error: 'startMc and endMc must be numbers' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const results: Array<{
        mcNumber: number;
        usdot: string;
        phone: string;
        email: string;
        status: string;
      }> = [];
      
      // Process in batches of 10 for concurrency
      const BATCH_SIZE = 10;
      for (let i = startMc; i <= endMc; i += BATCH_SIZE) {
        const batchEnd = Math.min(i + BATCH_SIZE - 1, endMc);
        const mcNumbers = [];
        for (let mc = i; mc <= batchEnd; mc++) {
          mcNumbers.push(mc);
        }
        
        const batchResults = await processBatch(mcNumbers);
        results.push(...batchResults);
        
        // Small 
      }
      
      return new Response(
        JSON.stringify({ success: true, data: results, total: endMc - startMc + 1, found: results.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: 'Provide either mcNumber, batchMcs array, or startMc/endMc range' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
