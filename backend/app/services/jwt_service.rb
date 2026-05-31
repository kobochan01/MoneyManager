class JwtService
  SECRET_KEY = ENV.fetch("JWT_SECRET_KEY") { Rails.application.secret_key_base }
  ALGORITHM = "HS256"
  EXPIRATION = 24.hours

  def self.encode(payload)
    payload = payload.merge(exp: EXPIRATION.from_now.to_i)
    JWT.encode(payload, SECRET_KEY, ALGORITHM)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: ALGORITHM })
    HashWithIndifferentAccess.new(decoded.first)
  rescue JWT::ExpiredSignature
    raise JWT::DecodeError, "Token has expired"
  rescue JWT::DecodeError => e
    raise JWT::DecodeError, e.message
  end
end
