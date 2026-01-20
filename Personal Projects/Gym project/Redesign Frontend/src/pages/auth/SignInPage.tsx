import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Field,
  Input,
  VStack,
  HStack,
  Checkbox,
  Card,
  Text,
  Separator,
} from '@chakra-ui/react';
import { HiMail, HiLockClosed } from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/utils/toast';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ModernButton } from '@/components/ui/ModernButton';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    document.title = 'Sign In • PAYZHE';
    
    // Redirect if already authenticated
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      const result = await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe || false,
      });

      if (result.success) {
        toast.create({
          title: 'Success',
          description: 'Signed in successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Redirect to intended page or dashboard
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        toast.create({
          title: 'Error',
          description: result.message || 'Failed to sign in',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast.create({
        title: 'Error',
        description: getErrorMessage(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .signin-logo-fade-in {
          animation: fadeIn 0.6s ease-in;
        }
      `}</style>
      <Box
        w="full"
        maxW={{ base: 'md', lg: 'lg' }}
        mx="auto"
        px={{ base: 4, sm: 0 }}
        className="signin-fade-in"
        style={{ animation: 'fadeIn 0.5s ease-in' }}
      >
      <Card.Root
        shadow="none"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="white"
        bg="white"
      >
        <Card.Body p={{ base: 6, md: 8 }}>
          <VStack gap={8} align="stretch">
            {/* Header Section with Logo */}
            <Box textAlign="center">
              <Box
                mb={4}
                display="flex"
                justifyContent="center"
                alignItems="center"
                className="signin-logo-fade-in"
                style={{ animation: 'fadeIn 0.6s ease-in' }}
              >
                <img
                  src="/logo.png"
                  alt="PAYZHE Logo"
                  style={{
                    maxWidth: 'min(280px, 70vw)',
                    height: 'auto',
                    display: 'block',
                  }}
                />
              </Box>
              <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }} mt={2}>
                Sign in to your PAYZHE account
              </Text>
            </Box>

            {/* Form Section */}
            <Box as="form" onSubmit={handleSubmit(onSubmit)}>
              <VStack gap={6} align="stretch">
                {/* Email Field */}
                <Field.Root invalid={!!errors.email}>
                  <Field.Label 
                    fontSize="sm" 
                    fontWeight="semibold" 
                    mb={2.5}
                    color="gray.700"
                  >
                    Email Address
                  </Field.Label>
                  <Box position="relative" className="email-field-wrapper" w="full">
                    <Box
                      position="absolute"
                      left="14px"
                      top="50%"
                      transform="translateY(-50%)"
                      pointerEvents="none"
                      zIndex={1}
                      color="gray.400"
                      className="email-icon"
                      transition="color 0.2s ease"
                    >
                      <HiMail size={20} />
                    </Box>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      pl="48px"
                      pr="12px"
                      size="lg"
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor="gray.200"
                      bg="white"
                      minH={{ base: '48px', md: '52px' }}
                      fontSize={{ base: '16px', md: 'md' }}
                      width="full"
                      _hover={{
                        borderColor: 'gray.300',
                      }}
                      _focus={{
                        borderColor: 'red.500',
                        boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.1)',
                      }}
                      _invalid={{
                        borderColor: 'red.500',
                        boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.1)',
                      }}
                      _disabled={{
                        bg: 'gray.50',
                        cursor: 'not-allowed',
                        opacity: 0.6,
                      }}
                      transition="all 0.2s ease"
                      {...(register('email') as any)}
                      onFocus={(e) => {
                        const icon = e.currentTarget.parentElement?.querySelector('.email-icon');
                        if (icon) {
                          (icon as HTMLElement).style.color = '#DC2626';
                        }
                      }}
                      onBlur={(e) => {
                        const icon = e.currentTarget.parentElement?.querySelector('.email-icon');
                        if (icon && !e.currentTarget.value) {
                          (icon as HTMLElement).style.color = '#9CA3AF';
                        }
                      }}
                      aria-label="Email address"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                  </Box>
                  {errors.email && (
                    <Field.ErrorText 
                      id="email-error" 
                      mt={1.5}
                      fontSize="sm"
                      color="red.600"
                      fontWeight="medium"
                    >
                      {errors.email.message}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                {/* Password Field */}
                <Field.Root invalid={!!errors.password}>
                  <Field.Label 
                    fontSize="sm" 
                    fontWeight="semibold" 
                    mb={2.5}
                    color="gray.700"
                  >
                    Password
                  </Field.Label>
                  <Box position="relative" className="password-field-wrapper" w="full">
                    <Box
                      position="absolute"
                      left="14px"
                      top="50%"
                      transform="translateY(-50%)"
                      pointerEvents="none"
                      zIndex={2}
                      color="gray.400"
                      className="password-icon"
                      transition="color 0.2s ease"
                    >
                      <HiLockClosed size={20} />
                    </Box>
                    <PasswordInput
                      placeholder="Enter your password"
                      pl="48px"
                      size="lg"
                      borderRadius="xl"
                      borderWidth="2px"
                      minH={{ base: '48px', md: '52px' }}
                      fontSize={{ base: '16px', md: 'md' }}
                      _focus={{
                        borderColor: 'red.500',
                        boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.1)',
                      }}
                      _invalid={{
                        borderColor: 'red.500',
                        boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.1)',
                      }}
                      transition="all 0.2s ease"
                      {...register('password')}
                      invalid={!!errors.password}
                      aria-label="Password"
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      onFocus={(e) => {
                        const icon = e.currentTarget.parentElement?.parentElement?.querySelector('.password-icon');
                        if (icon) {
                          (icon as HTMLElement).style.color = '#DC2626';
                        }
                      }}
                      onBlur={(e) => {
                        const icon = e.currentTarget.parentElement?.parentElement?.querySelector('.password-icon');
                        if (icon && !e.currentTarget.value) {
                          (icon as HTMLElement).style.color = '#9CA3AF';
                        }
                      }}
                    />
                  </Box>
                  {errors.password && (
                    <Field.ErrorText 
                      id="password-error" 
                      mt={1.5}
                      fontSize="sm"
                      color="red.600"
                      fontWeight="medium"
                    >
                      {errors.password.message}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                {/* Remember Me & Forgot Password */}
                <HStack
                  justify="space-between"
                  align="center"
                  flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                  gap={{ base: 2, sm: 0 }}
                >
                  <Checkbox.Root {...register('rememberMe')}>
                    <Checkbox.Control />
                    <Checkbox.Label fontSize={{ base: 'xs', sm: 'sm' }} color="gray.700">
                      Remember me
                    </Checkbox.Label>
                  </Checkbox.Root>
                  <Box>
                    <Link
                      to="/reset-password"
                      style={{
                        fontSize: '0.75rem',
                        color: '#2563eb',
                        fontWeight: 500,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Box>
                </HStack>

                {/* Submit Button */}
                <ModernButton
                  type="submit"
                  colorPalette="red"
                  size="lg"
                  width="full"
                  loading={isLoading}
                  loadingText="Signing in..."
                  fontWeight="semibold"
                  borderRadius="xl"
                  h={{ base: '48px', md: '52px' }}
                  minH={{ base: '48px', md: '52px' }}
                  fontSize={{ base: 'md', md: 'lg' }}
                  transition="all 0.2s ease"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 20px rgba(220, 38, 38, 0.2)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                    boxShadow: '0 5px 10px rgba(220, 38, 38, 0.15)',
                  }}
                  _focus={{
                    boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.3)',
                  }}
                  disabled={isLoading}
                  mt={2}
                >
                  Sign In
                </ModernButton>
              </VStack>
            </Box>

            {/* Footer Section */}
            <Box>
              <Separator mb={4} />
              <Text
                textAlign="center"
                fontSize={{ base: 'xs', sm: 'sm' }}
                color="gray.600"
              >
                Secure login with SSL encryption
              </Text>
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
      </Box>
    </>
  );
}


