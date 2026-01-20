import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Heading,
  Field,
  Input,
  VStack,
  Container,
  Card,
  Text,
} from '@chakra-ui/react';
import { HiMail, HiCheckCircle } from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/services/api/auth';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/utils/toast';
import { ModernButton } from '@/components/ui/ModernButton';

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    document.title = 'Reset Password • PAYZHE';
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await authApi.forgotPassword(data.email);

      if (response.status === 'SUCCESS') {
        setIsSuccess(true);
        toast.create({
          title: 'Success',
          description: 'Password reset email sent. Please check your inbox.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast.create({
          title: 'Error',
          description: response.message || 'Failed to send reset email',
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

  if (isSuccess) {
    return (
      <>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .reset-password-fade-in {
            animation: fadeIn 0.5s ease-in;
          }
        `}</style>
        <Container 
          maxW={{ base: 'md', lg: 'lg' }} 
          py={{ base: 6, md: 8 }} 
          px={{ base: 4, md: 6 }}
          className="reset-password-fade-in"
        >
          <Card.Root
            shadow="xl"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="white"
            bg="white"
          >
            <Card.Body p={{ base: 6, md: 8 }}>
              <VStack gap={{ base: 4, md: 6 }} align="stretch" textAlign="center">
                {/* Success Icon */}
                <Box display="flex" justifyContent="center" mb={2}>
                  <Box
                    color="green.500"
                    fontSize={{ base: '3xl', md: '4xl' }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <HiCheckCircle size={48} />
                  </Box>
                </Box>
                <Heading size={{ base: 'lg', md: 'xl' }} fontWeight="bold">
                  Check Your Email
                </Heading>
                <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }} lineHeight="tall">
                  We've sent a password reset link to your email address. Please check your inbox and
                  follow the instructions to reset your password.
                </Text>
                <Box mt={2}>
                  <ModernButton 
                    asChild 
                    colorPalette="red" 
                    size="lg"
                    width="full"
                    borderRadius="xl"
                    h={{ base: '48px', md: '52px' }}
                    fontWeight="semibold"
                  >
                    <Link to="/sign-in" style={{ textDecoration: 'none' }}>Back to Sign In</Link>
                  </ModernButton>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Container>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reset-password-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        .reset-logo-fade-in {
          animation: fadeIn 0.6s ease-in;
        }
      `}</style>
      <Container 
        maxW={{ base: 'md', lg: 'lg' }} 
        py={{ base: 6, md: 8 }} 
        px={{ base: 4, md: 6 }}
        className="reset-password-fade-in"
      >
        <Card.Root
          shadow="xl"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="white"
          bg="white"
        >
          <Card.Body p={{ base: 6, md: 8 }}>
            <VStack gap={{ base: 6, md: 8 }} align="stretch">
              {/* Header Section with Logo */}
              <Box textAlign="center">
                <Box
                  mb={4}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  className="reset-logo-fade-in"
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
                <Heading 
                  size={{ base: 'lg', md: 'xl' }} 
                  fontWeight="bold"
                  mb={2}
                >
                  Reset Password
                </Heading>
                <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }}>
                  Enter your email address and we'll send you a link to reset your password.
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
                    <Box position="relative" className="reset-email-field-wrapper">
                      <Box
                        position="absolute"
                        left="14px"
                        top="50%"
                        transform="translateY(-50%)"
                        pointerEvents="none"
                        zIndex={1}
                        color="gray.400"
                        className="reset-email-icon"
                        transition="color 0.2s ease"
                      >
                        <HiMail size={20} />
                      </Box>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        pl="48px"
                        pr="16px"
                        size="lg"
                        borderRadius="xl"
                        borderWidth="2px"
                        borderColor="gray.200"
                        bg="white"
                        minH={{ base: '48px', md: '52px' }}
                        fontSize={{ base: '16px', md: 'md' }}
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
                        {...register('email')}
                        aria-label="Email address"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'reset-email-error' : undefined}
                      />
                      <style>{`
                        .reset-email-field-wrapper:has(input:focus) .reset-email-icon {
                          color: #DC2626;
                        }
                      `}</style>
                    </Box>
                    {errors.email && (
                      <Field.ErrorText 
                        id="reset-email-error" 
                        mt={1.5}
                        fontSize="sm"
                        color="red.600"
                        fontWeight="medium"
                      >
                        {errors.email.message}
                      </Field.ErrorText>
                    )}
                  </Field.Root>

                  {/* Submit Button */}
                  <ModernButton
                    type="submit"
                    colorPalette="red"
                    size="lg"
                    width="full"
                    loading={isLoading}
                    loadingText="Sending..."
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
                    Send Reset Link
                  </ModernButton>

                  {/* Back to Sign In Link */}
                  <Box textAlign="center" mt={2}>
                    <Link
                      to="/sign-in"
                      style={{
                        fontSize: '0.875rem',
                        color: '#6B7280',
                        fontWeight: 500,
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#DC2626';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#6B7280';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      ← Back to Sign In
                    </Link>
                  </Box>
                </VStack>
              </Box>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Container>
    </>
  );
}


