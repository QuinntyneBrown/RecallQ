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
