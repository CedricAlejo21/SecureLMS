<table>
<colgroup>
<col style="width: 20%" />
<col style="width: 79%" />
</colgroup>
<thead>
<tr class="header">
<th><img src="media/image1.jpeg"
style="width:1.33334in;height:0.66667in"
alt="DLSU CCS black white.jpg" /></th>
<th><p>De La Salle University</p>
<p>College of Computer Studies</p>
<p>Secure Web Development Case Project Checklist</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

| Name (LN, FN): | ALEJO, MANGULABNAN, TAHIMIC | Date:  | **Aug 2, 2025** |
|----------------|-----------------------------|--------|-----------------|
| Section:       | S17                         | Grade: |                 |

<table>
<colgroup>
<col style="width: 84%" />
<col style="width: 5%" />
<col style="width: 5%" />
<col style="width: 5%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Requirement</strong></th>
<th><blockquote>
<p><strong>Complete (2)</strong></p>
</blockquote></th>
<th><blockquote>
<p><strong>Incomplete (1)</strong></p>
</blockquote></th>
<th><blockquote>
<p><strong>Missing (0)</strong></p>
</blockquote></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><ol type="1">
<li><p><strong>Pre-demo Requirements (must be created before the actual
demo)</strong></p></li>
</ol></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol type="1">
<li><p><strong>Accounts (at least 1 per type of user)</strong></p></li>
</ol></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol type="1">
<li><p>Website Administrator</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol start="2" type="1">
<li><p>Product Manager</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="3" type="1">
<li><p>Customer</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol start="2" type="1">
<li><p><strong>Demo Requirements</strong></p></li>
</ol></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol type="1">
<li><p><strong>Authentication</strong></p></li>
</ol></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol type="1">
<li><p>Require authentication for all pages and resources, except those
specifically intended to be public</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="2" type="1">
<li><p>All authentication controls should fail securely</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol start="3" type="1">
<li><p>Only cryptographically strong one-way salted hashes of passwords
are stored</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="4" type="1">
<li><p>Authentication failure responses should not indicate which part
of the authentication data was incorrect. For example, instead of
"Invalid username" or "Invalid password", just use "Invalid username
and/or password" for both</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol start="5" type="1">
<li><p>Enforce password complexity requirements established by policy or
regulation</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="6" type="1">
<li><p>Enforce password length requirements established by policy or
regulation</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol start="7" type="1">
<li><p>Password entry should be obscured on the user's screen (use of
dots or asterisks on the display)</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="8" type="1">
<li><p>Enforce account disabling after an established number of invalid
login attempts (e.g., five</p></li>
</ol>
<blockquote>
<p>attempts is common). The account must be disabled for a period of
time sufficient to discourage brute force guessing of credentials, but
not so long as to allow for a denial-of-service attack to be
performed</p>
</blockquote></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol start="9" type="1">
<li><p>Password reset questions should support sufficiently random
answers. (e.g., "favorite book" is a bad question because “The Bible” is
a very common answer)</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="10" type="1">
<li><p>Prevent password re-use</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol start="11" type="1">
<li><p>Passwords should be at least one day old before they can be
changed, to prevent attacks on</p></li>
</ol>
<blockquote>
<p>password re-use</p>
</blockquote></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="12" type="1">
<li><p>The last use (successful or unsuccessful) of a user account
should be reported to the user at their next successful login</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol start="13" type="1">
<li><p>Re-authenticate users prior to performing critical operations
such as password change</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="2" type="1">
<li><p><strong>Authorization/Access Control</strong></p></li>
</ol></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol type="1">
<li><p>Use a single site-wide component to check access
authorization</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="2" type="1">
<li><p>Access controls should fail securely</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol start="3" type="1">
<li><p>Enforce application logic flows to comply with business
rules</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="3" type="1">
<li><p><strong>Data Validation</strong></p></li>
</ol></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol type="1">
<li><p>All validation failures should result in input rejection.
Sanitizing should not be used.</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="2" type="1">
<li><p>Validate data range</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol start="3" type="1">
<li><p>Validate data length</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="4" type="1">
<li><p><strong>Error Handling and Logging</strong></p></li>
</ol></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol type="1">
<li><p>Use error handlers that do not display debugging or stack trace
information</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="2" type="1">
<li><p>Implement generic error messages and use custom error
pages</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol start="3" type="1">
<li><p>Logging controls should support both success and failure of
specified security events</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="4" type="1">
<li><p>Restrict access to logs to only website administrators</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol start="5" type="1">
<li><p>Log all input validation failures</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td><ol start="6" type="1">
<li><p>Log all authentication attempts, especially failures</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td><ol start="7" type="1">
<li><p>Log all access control failures</p></li>
</ol></td>
<td>✓</td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td>TOTAL</td>
<td colspan="3"></td>
</tr>
</tbody>
</table>
