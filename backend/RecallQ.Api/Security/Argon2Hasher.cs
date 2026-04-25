using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;

namespace RecallQ.Api.Security;

public class Argon2Hasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int DegreeOfParallelism = 2;
    private const int MemorySize = 19456;
    private const int Iterations = 2;

    // A constant Argon2id-formatted hash whose preimage is unknown. The
    // login endpoint runs Verify against this when the user lookup
    // misses, so the unknown-email path takes the same wall-clock time
    // as the wrong-password path. Verify will always return false
    // against any user-supplied password but still runs the full
    // Argon2id KDF, equalizing timing.
    public static readonly string DummyHash =
        "$argon2id$v=19$m=19456,t=2,p=2$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = ComputeHash(password, salt);
        return $"$argon2id$v=19$m={MemorySize},t={Iterations},p={DegreeOfParallelism}$" +
               $"{Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public bool Verify(string password, string hash)
    {
        try
        {
            var parts = hash.Split('$');
            // ["", "argon2id", "v=19", "m=...,t=...,p=...", "<salt>", "<hash>"]
            if (parts.Length != 6 || parts[1] != "argon2id") return false;
            var salt = Convert.FromBase64String(parts[4]);
            var expected = Convert.FromBase64String(parts[5]);
            var actual = ComputeHash(password, salt);
            return CryptographicOperations.FixedTimeEquals(expected, actual);
        }
        catch
        {
            return false;
        }
    }

    private static byte[] ComputeHash(string password, byte[] salt)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = DegreeOfParallelism,
            MemorySize = MemorySize,
            Iterations = Iterations
        };
        return argon2.GetBytes(HashSize);
    }
}
